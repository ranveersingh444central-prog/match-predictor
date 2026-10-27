"""
UFC Leakage-Safe Feature Engineering Pipeline for PITCHIQ
Computes pre-fight physical, biographical, and chronological performance differentials.
Strictly isolates target and future bouts (t < target_date) to prevent any future-data leakage.
All striking, grappling, form, and rate features are computed exclusively from bouts
preceding the target bout, eliminating any static career-average leakage.
"""

import json
import re
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UFC_PROCESSED_DIR = BASE_DIR / "data" / "ufc" / "processed"
UFC_REPORTS_DIR = BASE_DIR / "reports" / "ufc"

# Explicit canonical pre-fight feature columns used by UFC models
FEATURE_COLUMNS = [
    # Physical and biological differentials (Red - Blue)
    "height_diff",
    "reach_diff",
    "age_diff",
    "age_r",
    "age_b",
    "is_southpaw_r",
    "is_southpaw_b",
    "stance_orthodox_vs_southpaw",
    # Experience and record differentials (Red - Blue)
    "total_fights_diff",
    "total_fights_r",
    "total_fights_b",
    "win_pct_diff",
    "win_pct_r",
    "win_pct_b",
    "win_streak_diff",
    "win_streak_r",
    "win_streak_b",
    # Form and activity differentials
    "form_diff_roll3",
    "form_roll3_r",
    "form_roll3_b",
    "form_diff_roll5",
    "layoff_diff_days",
    "layoff_days_r",
    "layoff_days_b",
    "finish_rate_diff",
    "is_debut_r",
    "is_debut_b",
    # Strictly date-aware rolling technical striking and grappling differentials (Red - Blue)
    "slpm_diff",
    "sapm_diff",
    "str_acc_diff",
    "str_def_diff",
    "td_avg_diff",
    "td_def_diff",
    "sub_avg_diff",
    # Event context
    "title_bout"
]

def parse_ratio_str(ratio_str) -> tuple[int, int]:
    """Parses string formatted as 'X of Y' into (landed, attempted) integers."""
    if pd.isna(ratio_str):
        return (0, 0)
    parts = str(ratio_str).strip().split(" of ")
    if len(parts) == 2:
        try:
            return (int(parts[0].strip()), int(parts[1].strip()))
        except (ValueError, TypeError):
            return (0, 0)
    return (0, 0)

def parse_fight_minutes(last_round, last_round_time_str) -> float:
    """Calculates fight duration in minutes from round number and MM:SS timestamp."""
    try:
        lr = max(int(last_round), 1)
        t_parts = str(last_round_time_str).strip().split(":")
        if len(t_parts) == 2:
            sec_in_round = int(t_parts[0]) * 60 + int(t_parts[1])
        else:
            sec_in_round = 300
    except Exception:
        lr = 1
        sec_in_round = 300
    total_seconds = (lr - 1) * 300 + sec_in_round
    return max(total_seconds / 60.0, 0.1)

def get_fighter_profile_dict(fighters_df: pd.DataFrame) -> dict:
    """Pre-indexes clean fighter profiles for O(1) dictionary lookups."""
    return fighters_df.set_index("fighter_name").to_dict(orient="index")

def compute_athlete_prior_stats(bouts_list: list[dict], target_date: pd.Timestamp) -> dict:
    """
    Computes an athlete's rolling record, form, striking rates, and grappling stats
    strictly from completed bouts preceding target_date (t < target_date).
    Never uses static career totals or future bouts.
    """
    # Strict temporal filter: strictly prior to target_date
    prior = [b for b in bouts_list if b["date"] < target_date]
    n_prior = len(prior)

    # Missing value strategy for debutants / athletes with 0 prior UFC ring time
    if n_prior == 0:
        return {
            "total_fights": 0,
            "wins": 0,
            "losses": 0,
            "win_pct": 0.50,  # Prior baseline for debutant
            "win_streak": 0,
            "loss_streak": 0,
            "form_roll3": 0.50,
            "form_roll5": 0.50,
            "layoff_days": 240.0,  # Median UFC layoff
            "finish_rate": 0.50,
            "title_bouts": 0,
            "is_debut": 1.0,
            # Neutral historical domain medians for unobserved rate stats
            "slpm": 2.80,
            "sapm": 2.80,
            "str_acc": 0.45,
            "str_def": 0.55,
            "td_avg": 1.20,
            "td_def": 0.60,
            "sub_avg": 0.50
        }

    # Chronologically sort prior bouts
    prior = sorted(prior, key=lambda x: x["date"])
    wins = sum(b.get("won", 0) for b in prior)
    losses = n_prior - wins
    win_pct = float(wins / n_prior)

    # Win streak and loss streak leading into target fight
    win_streak = 0
    loss_streak = 0
    for b in reversed(prior):
        if b.get("won", 0) == 1:
            if loss_streak == 0:
                win_streak += 1
            else:
                break
        else:
            if win_streak == 0:
                loss_streak += 1
            else:
                break

    # Recent form (last 3 and last 5)
    last3 = prior[-3:]
    form_roll3 = float(sum(b.get("won", 0) for b in last3) / len(last3))
    last5 = prior[-5:]
    form_roll5 = float(sum(b.get("won", 0) for b in last5) / len(last5))

    # Layoff in days
    last_date = prior[-1]["date"]
    layoff_days = min(float((target_date - last_date).days), 730.0)

    # Finishes among wins
    finishes = sum(1 for b in prior if b.get("won", 0) == 1 and b.get("method") in ["KO/TKO", "Submission"])
    finish_rate = float(finishes / wins) if wins > 0 else 0.0

    title_bouts = sum(1 for b in prior if b.get("is_title", False))

    # Accumulate strictly historical striking and grappling totals
    total_mins = sum(b.get("mins", 0.0) for b in prior)
    if total_mins <= 0.0:
        slpm = 2.80
        sapm = 2.80
        str_acc = 0.45
        str_def = 0.55
        td_avg = 1.20
        td_def = 0.60
        sub_avg = 0.50
    else:
        sig_landed = sum(b.get("sig_landed", 0) for b in prior)
        sig_att = sum(b.get("sig_att", 0) for b in prior)
        sig_abs = sum(b.get("sig_abs", 0) for b in prior)
        sig_opp_att = sum(b.get("sig_opp_att", 0) for b in prior)
        td_landed = sum(b.get("td_landed", 0) for b in prior)
        td_att = sum(b.get("td_att", 0) for b in prior)
        td_abs = sum(b.get("td_abs", 0) for b in prior)
        td_opp_att = sum(b.get("td_opp_att", 0) for b in prior)
        sub_att = sum(b.get("sub_att", 0) for b in prior)

        slpm = float(sig_landed / total_mins)
        sapm = float(sig_abs / total_mins)
        str_acc = float(sig_landed / sig_att) if sig_att > 0 else 0.45
        str_def = float(1.0 - (sig_abs / sig_opp_att)) if sig_opp_att > 0 else 0.55
        td_avg = float((td_landed / total_mins) * 15.0)
        td_def = float(1.0 - (td_abs / td_opp_att)) if td_opp_att > 0 else 0.60
        sub_avg = float((sub_att / total_mins) * 15.0)

    return {
        "total_fights": n_prior,
        "wins": wins,
        "losses": losses,
        "win_pct": win_pct,
        "win_streak": win_streak,
        "loss_streak": loss_streak,
        "form_roll3": form_roll3,
        "form_roll5": form_roll5,
        "layoff_days": layoff_days,
        "finish_rate": finish_rate,
        "title_bouts": title_bouts,
        "is_debut": 0.0,
        "slpm": slpm,
        "sapm": sapm,
        "str_acc": str_acc,
        "str_def": str_def,
        "td_avg": td_avg,
        "td_def": td_def,
        "sub_avg": sub_avg
    }

def build_single_fight_feature_vector(
    red_name: str,
    blue_name: str,
    target_date: pd.Timestamp,
    red_prior_bouts: list[dict],
    blue_prior_bouts: list[dict],
    profiles_dict: dict,
    is_title_bout: bool = False
) -> dict:
    """
    Constructs an isolated pre-fight feature dictionary comparing Red and Blue corners.
    Never touches in-fight scores, target bout outcome, future bouts, or static 2021 profiles.
    """
    # 1. Invariant physical traits from profiles
    r_prof = profiles_dict.get(red_name, {})
    b_prof = profiles_dict.get(blue_name, {})

    # Height (inches): fallback to 70.0 (5'10" UFC average)
    r_height = r_prof.get("height_in", np.nan)
    b_height = b_prof.get("height_in", np.nan)
    r_height = 70.0 if pd.isna(r_height) else float(r_height)
    b_height = 70.0 if pd.isna(b_height) else float(b_height)
    height_diff = r_height - b_height

    # Reach (inches): fallback to height or 70.0
    r_reach = r_prof.get("reach_in", np.nan)
    b_reach = b_prof.get("reach_in", np.nan)
    r_reach = r_height if pd.isna(r_reach) else float(r_reach)
    b_reach = b_height if pd.isna(b_reach) else float(b_reach)
    reach_diff = r_reach - b_reach

    # Age at fight date: computed dynamically from target_date and athlete DOB
    r_dob = r_prof.get("dob")
    b_dob = b_prof.get("dob")
    if pd.notna(r_dob):
        age_r = float((target_date - pd.to_datetime(r_dob)).days / 365.25)
    else:
        age_r = 29.5
    if pd.notna(b_dob):
        age_b = float((target_date - pd.to_datetime(b_dob)).days / 365.25)
    else:
        age_b = 29.5
    age_diff = age_r - age_b

    # Stance
    r_stance = str(r_prof.get("stance", "")).strip().lower()
    b_stance = str(b_prof.get("stance", "")).strip().lower()
    is_southpaw_r = 1.0 if "southpaw" in r_stance else 0.0
    is_southpaw_b = 1.0 if "southpaw" in b_stance else 0.0
    stance_orthodox_vs_southpaw = 1.0 if (is_southpaw_r != is_southpaw_b) else 0.0

    # 2. Historical performance before target_date (strictly prior bouts)
    r_stats = compute_athlete_prior_stats(red_prior_bouts, target_date)
    b_stats = compute_athlete_prior_stats(blue_prior_bouts, target_date)

    total_fights_diff = float(r_stats["total_fights"] - b_stats["total_fights"])
    win_pct_diff = float(r_stats["win_pct"] - b_stats["win_pct"])
    win_streak_diff = float(r_stats["win_streak"] - b_stats["win_streak"])
    form_diff_roll3 = float(r_stats["form_roll3"] - b_stats["form_roll3"])
    form_diff_roll5 = float(r_stats["form_roll5"] - b_stats["form_roll5"])
    layoff_diff_days = float(r_stats["layoff_days"] - b_stats["layoff_days"])
    finish_rate_diff = float(r_stats["finish_rate"] - b_stats["finish_rate"])

    # 3. Strictly date-aware striking and grappling rate differentials (NO STATIC PROFILES)
    slpm_diff = r_stats["slpm"] - b_stats["slpm"]
    sapm_diff = r_stats["sapm"] - b_stats["sapm"]
    str_acc_diff = r_stats["str_acc"] - b_stats["str_acc"]
    str_def_diff = r_stats["str_def"] - b_stats["str_def"]
    td_avg_diff = r_stats["td_avg"] - b_stats["td_avg"]
    td_def_diff = r_stats["td_def"] - b_stats["td_def"]
    sub_avg_diff = r_stats["sub_avg"] - b_stats["sub_avg"]

    title_flag = 1.0 if is_title_bout else 0.0

    return {
        "height_diff": round(height_diff, 2),
        "reach_diff": round(reach_diff, 2),
        "age_diff": round(age_diff, 2),
        "age_r": round(age_r, 2),
        "age_b": round(age_b, 2),
        "is_southpaw_r": is_southpaw_r,
        "is_southpaw_b": is_southpaw_b,
        "stance_orthodox_vs_southpaw": stance_orthodox_vs_southpaw,
        "total_fights_diff": total_fights_diff,
        "total_fights_r": float(r_stats["total_fights"]),
        "total_fights_b": float(b_stats["total_fights"]),
        "win_pct_diff": round(win_pct_diff, 4),
        "win_pct_r": round(r_stats["win_pct"], 4),
        "win_pct_b": round(b_stats["win_pct"], 4),
        "win_streak_diff": float(win_streak_diff),
        "win_streak_r": float(r_stats["win_streak"]),
        "win_streak_b": float(b_stats["win_streak"]),
        "form_diff_roll3": round(form_diff_roll3, 4),
        "form_roll3_r": round(r_stats["form_roll3"], 4),
        "form_roll3_b": round(b_stats["form_roll3"], 4),
        "form_diff_roll5": round(form_diff_roll5, 4),
        "layoff_diff_days": round(layoff_diff_days, 1),
        "layoff_days_r": round(r_stats["layoff_days"], 1),
        "layoff_days_b": round(b_stats["layoff_days"], 1),
        "finish_rate_diff": round(finish_rate_diff, 4),
        "is_debut_r": r_stats["is_debut"],
        "is_debut_b": b_stats["is_debut"],
        "slpm_diff": round(slpm_diff, 3),
        "sapm_diff": round(sapm_diff, 3),
        "str_acc_diff": round(str_acc_diff, 4),
        "str_def_diff": round(str_def_diff, 4),
        "td_avg_diff": round(td_avg_diff, 3),
        "td_def_diff": round(td_def_diff, 4),
        "sub_avg_diff": round(sub_avg_diff, 3),
        "title_bout": title_flag
    }

def generate_chronological_feature_dataset(
    fights_df: pd.DataFrame,
    fighters_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Iterates strictly chronologically through all UFC bouts.
    Computes pre-fight features BEFORE appending the bout's outcome and stats to historical records.
    Saves clean features dataset ready for ML training.
    """
    fights_df = fights_df.sort_values(by=["date", "R_fighter"]).reset_index(drop=True)
    fights_df["date"] = pd.to_datetime(fights_df["date"])
    fighters_df["dob"] = pd.to_datetime(fighters_df["dob"])
    profiles_dict = get_fighter_profile_dict(fighters_df)

    history: dict[str, list[dict]] = {}
    rows = []

    for idx, row in fights_df.iterrows():
        r_name = str(row["R_fighter"]).strip()
        b_name = str(row["B_fighter"]).strip()
        f_date = row["date"]
        is_title = bool(row.get("title_bout", False))

        # 1. Compute pre-fight feature vector strictly before updating history
        r_prior = history.get(r_name, [])
        b_prior = history.get(b_name, [])

        feat_vector = build_single_fight_feature_vector(
            red_name=r_name,
            blue_name=b_name,
            target_date=f_date,
            red_prior_bouts=r_prior,
            blue_prior_bouts=b_prior,
            profiles_dict=profiles_dict,
            is_title_bout=is_title
        )

        # Meta attributes
        meta = {
            "fight_index": idx,
            "date": f_date.strftime("%Y-%m-%d"),
            "R_fighter": r_name,
            "B_fighter": b_name,
            "weight_class": str(row.get("weight_class", "Catch Weight")),
            "method": str(row.get("method_clean", "Unknown")),
            "result_target": str(row.get("result_target", "Draw/NC")),
            "winner_code": int(row.get("winner_code", -1)),
            **feat_vector
        }
        rows.append(meta)

        # 2. Update athlete history STRICTLY AFTER computing pre-fight features
        r_won = 1 if row["Winner"] == r_name else 0
        b_won = 1 if row["Winner"] == b_name else 0
        method = str(row.get("method_clean", "Other"))

        # Parse in-fight statistics from target bout
        r_sig_l, r_sig_a = parse_ratio_str(row.get("R_SIG_STR."))
        b_sig_l, b_sig_a = parse_ratio_str(row.get("B_SIG_STR."))
        r_td_l, r_td_a = parse_ratio_str(row.get("R_TD"))
        b_td_l, b_td_a = parse_ratio_str(row.get("B_TD"))
        try:
            r_sub = int(row.get("R_SUB_ATT", 0))
        except (ValueError, TypeError):
            r_sub = 0
        try:
            b_sub = int(row.get("B_SUB_ATT", 0))
        except (ValueError, TypeError):
            b_sub = 0
        fight_mins = parse_fight_minutes(row.get("last_round", 1), row.get("last_round_time", "5:00"))

        history.setdefault(r_name, []).append({
            "date": f_date,
            "won": r_won,
            "method": method,
            "is_title": is_title,
            "mins": fight_mins,
            "sig_landed": r_sig_l,
            "sig_att": r_sig_a,
            "sig_abs": b_sig_l,
            "sig_opp_att": b_sig_a,
            "td_landed": r_td_l,
            "td_att": r_td_a,
            "td_abs": b_td_l,
            "td_opp_att": b_td_a,
            "sub_att": r_sub
        })
        history.setdefault(b_name, []).append({
            "date": f_date,
            "won": b_won,
            "method": method,
            "is_title": is_title,
            "mins": fight_mins,
            "sig_landed": b_sig_l,
            "sig_att": b_sig_a,
            "sig_abs": r_sig_l,
            "sig_opp_att": r_sig_a,
            "td_landed": b_td_l,
            "td_att": b_td_a,
            "td_abs": r_td_l,
            "td_opp_att": r_td_a,
            "sub_att": b_sub
        })

    feat_df = pd.DataFrame(rows)

    # Export to processed directory
    out_path = UFC_PROCESSED_DIR / "ufc_features.csv"
    feat_df.to_csv(out_path, index=False)

    # Feature audit report
    report = {
        "total_feature_rows": len(feat_df),
        "feature_count": len(FEATURE_COLUMNS),
        "feature_names": FEATURE_COLUMNS,
        "date_range": {
            "start": feat_df["date"].min(),
            "end": feat_df["date"].max()
        },
        "target_balance": feat_df["result_target"].value_counts().to_dict(),
        "missing_values": feat_df[FEATURE_COLUMNS].isna().sum().to_dict()
    }
    with open(UFC_REPORTS_DIR / "ufc_feature_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return feat_df

if __name__ == "__main__":
    f_path = UFC_PROCESSED_DIR / "fights_clean.csv"
    p_path = UFC_PROCESSED_DIR / "fighters_clean.csv"
    if not f_path.exists() or not p_path.exists():
        from ufc_validation import run_validation_pipeline
        run_validation_pipeline()

    fights = pd.read_csv(f_path)
    fighters = pd.read_csv(p_path)

    df_feats = generate_chronological_feature_dataset(fights, fighters)
    print("Features generated successfully:")
    print("Shape:", df_feats.shape)
    print("Columns:", len(FEATURE_COLUMNS))
    print("Sample feature values:\n", df_feats[FEATURE_COLUMNS].iloc[-1].to_dict())
