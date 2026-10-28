"""
UFC Match Prediction and Tale-of-the-Tape Analytics Module for PITCHIQ
Computes win probabilities for two fighters using the trained chronological ML pipeline.
Ensures P(Fighter A) + P(Fighter B) == 1.0 (subject to floating-point tolerance).
Provides data-quality indicators, Tale-of-the-Tape side-by-side stats,
finish method breakdown, and transparent factor explanations.
Strictly isolates target and future bouts (t < target_date) with zero leakage.
"""

import json
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UFC_PROCESSED_DIR = BASE_DIR / "data" / "ufc" / "processed"
UFC_ARTIFACTS_DIR = BASE_DIR / "artifacts" / "ufc"

from ufc_features import (
    FEATURE_COLUMNS,
    build_single_fight_feature_vector,
    compute_athlete_prior_stats,
    get_fighter_profile_dict,
    parse_ratio_str,
    parse_fight_minutes
)

# Global model and data caches
_UFC_MODEL = None
_UFC_METHOD_MODEL = None
_FIGHTERS_DF = None
_FIGHTS_DF = None
_PROFILES_DICT = None
_FIGHTER_HISTORY_CACHE = None

def get_cached_ufc_resources():
    """Lazily loads and caches UFC model artifacts, fighter profiles, and bout histories."""
    global _UFC_MODEL, _UFC_METHOD_MODEL, _FIGHTERS_DF, _FIGHTS_DF, _PROFILES_DICT, _FIGHTER_HISTORY_CACHE

    if _UFC_MODEL is None:
        model_path = UFC_ARTIFACTS_DIR / "ufc_model.joblib"
        if not model_path.exists():
            from ufc_train import train_and_evaluate_ufc_pipeline
            train_and_evaluate_ufc_pipeline()
        _UFC_MODEL = joblib.load(model_path)

    if _UFC_METHOD_MODEL is None:
        method_path = UFC_ARTIFACTS_DIR / "ufc_method_model.joblib"
        if method_path.exists():
            _UFC_METHOD_MODEL = joblib.load(method_path)

    if _FIGHTERS_DF is None:
        fighters_path = UFC_PROCESSED_DIR / "fighters_clean.csv"
        if not fighters_path.exists():
            from ufc_validation import run_validation_pipeline
            run_validation_pipeline()
        _FIGHTERS_DF = pd.read_csv(fighters_path)
        _FIGHTERS_DF["dob"] = pd.to_datetime(_FIGHTERS_DF["dob"])
        _PROFILES_DICT = get_fighter_profile_dict(_FIGHTERS_DF)

    if _FIGHTS_DF is None or _FIGHTER_HISTORY_CACHE is None:
        fights_path = UFC_PROCESSED_DIR / "fights_clean.csv"
        _FIGHTS_DF = pd.read_csv(fights_path)
        _FIGHTS_DF["date"] = pd.to_datetime(_FIGHTS_DF["date"])

        # Build chronological fast-lookup history map with in-fight strike and grappling stats
        history_map: dict[str, list[dict]] = {}
        for _, row in _FIGHTS_DF.sort_values(by="date").iterrows():
            r = str(row["R_fighter"]).strip()
            b = str(row["B_fighter"]).strip()
            dt = row["date"]
            method = str(row.get("method_clean", "Other"))
            is_title = bool(row.get("title_bout", False))

            r_won = 1 if row["Winner"] == r else 0
            b_won = 1 if row["Winner"] == b else 0

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

            history_map.setdefault(r, []).append({
                "date": dt,
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
            history_map.setdefault(b, []).append({
                "date": dt,
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

        _FIGHTER_HISTORY_CACHE = history_map

    return _UFC_MODEL, _UFC_METHOD_MODEL, _FIGHTERS_DF, _PROFILES_DICT, _FIGHTER_HISTORY_CACHE

def predict_ufc_bout(
    fighter_a: str,
    fighter_b: str,
    target_date: str | datetime | pd.Timestamp = None,
    is_title_bout: bool = False,
    corner_a: str = "Red",
    corner_b: str = "Blue"
) -> dict:
    """
    Predicts the win probabilities for a bout between fighter_a and fighter_b.
    Returns calibrated probabilities where P(fighter_a) + P(fighter_b) == 1.0.
    """
    name_a = str(fighter_a).strip()
    name_b = str(fighter_b).strip()

    if not name_a or not name_b:
        raise ValueError("Both fighter names must be specified.")

    if name_a.lower() == name_b.lower():
        raise ValueError(f"Fighter A and Fighter B cannot be the same athlete: '{name_a}'")

    model, method_model, fighters_df, profiles_dict, history_cache = get_cached_ufc_resources()

    prof_a = profiles_dict.get(name_a)
    prof_b = profiles_dict.get(name_b)

    if prof_a is None:
        raise ValueError(f"Fighter '{name_a}' not found in official UFC database.")
    if prof_b is None:
        raise ValueError(f"Fighter '{name_b}' not found in official UFC database.")

    # Target date determination
    if target_date is None:
        eval_date = pd.Timestamp.now()
    elif isinstance(target_date, (datetime, pd.Timestamp)):
        eval_date = pd.to_datetime(target_date)
    else:
        eval_date = pd.to_datetime(target_date)

    # Symmetric Dual-Pass Feature & Inference Evaluation:
    # Eliminates artificial red-corner matchmaking bias and guarantees mathematical symmetry:
    # P(A beats B) + P(B beats A) == 1.0, and P(A vs B) == P(A vs B) invariant to corner entry.

    # Pass 1: Fighter A as Red, Fighter B as Blue
    feat_ab = build_single_fight_feature_vector(
        red_name=name_a,
        blue_name=name_b,
        target_date=eval_date,
        red_prior_bouts=history_cache.get(name_a, []),
        blue_prior_bouts=history_cache.get(name_b, []),
        profiles_dict=profiles_dict,
        is_title_bout=is_title_bout
    )
    X_ab = pd.DataFrame([feat_ab])[FEATURE_COLUMNS]

    # Pass 2: Fighter B as Red, Fighter A as Blue
    feat_ba = build_single_fight_feature_vector(
        red_name=name_b,
        blue_name=name_a,
        target_date=eval_date,
        red_prior_bouts=history_cache.get(name_b, []),
        blue_prior_bouts=history_cache.get(name_a, []),
        profiles_dict=profiles_dict,
        is_title_bout=is_title_bout
    )
    X_ba = pd.DataFrame([feat_ba])[FEATURE_COLUMNS]

    # Predict probas across both orientations
    # model.classes_ is [0, 1] where 1 = Red win, 0 = Blue win
    proba_ab = model.predict_proba(X_ab)[0]
    p_red_ab = float(proba_ab[1])   # P(A wins as Red)
    p_blue_ab = float(proba_ab[0])  # P(B wins as Blue)

    proba_ba = model.predict_proba(X_ba)[0]
    p_red_ba = float(proba_ba[1])   # P(B wins as Red)
    p_blue_ba = float(proba_ba[0])  # P(A wins as Blue)

    # Invariant symmetric win probability for Fighter A and Fighter B
    prob_a = float((p_red_ab + p_blue_ba) / 2.0)
    prob_b = float((p_red_ba + p_blue_ab) / 2.0)

    # Strict normalization to guarantee exact 100% sum
    total_prob = prob_a + prob_b
    prob_a = float(prob_a / total_prob)
    prob_b = float(prob_b / total_prob)

    # Decimal odds equivalent (fair price)
    odds_a = round(1.0 / prob_a, 2) if prob_a > 0.01 else 99.0
    odds_b = round(1.0 / prob_b, 2) if prob_b > 0.01 else 99.0

    predicted_winner = name_a if prob_a >= prob_b else name_b
    winner_prob = max(prob_a, prob_b)

    # Confidence rating
    if winner_prob >= 0.70:
        confidence = "High Edge"
    elif winner_prob >= 0.58:
        confidence = "Moderate Edge"
    else:
        confidence = "Competitive Matchup"

    # Secondary Finish Method breakdown (symmetric across orientations)
    method_probs = {}
    if method_model is not None:
        try:
            m_proba_ab = method_model.predict_proba(X_ab)[0]
            m_proba_ba = method_model.predict_proba(X_ba)[0]
            m_classes = method_model.classes_
            m_proba = (m_proba_ab + m_proba_ba) / 2.0
            sum_m = sum(m_proba) if sum(m_proba) > 0 else 1.0
            for cls_name, p_val in zip(m_classes, m_proba):
                method_probs[cls_name] = round(float(p_val / sum_m), 3)
        except Exception:
            method_probs = {"Decision": 0.50, "KO/TKO": 0.33, "Submission": 0.17}
    else:
        method_probs = {"Decision": 0.50, "KO/TKO": 0.33, "Submission": 0.17}

    # Pre-fight athlete stats
    a_stats = compute_athlete_prior_stats(history_cache.get(name_a, []), eval_date)
    b_stats = compute_athlete_prior_stats(history_cache.get(name_b, []), eval_date)

    prior_a = [b for b in history_cache.get(name_a, []) if b["date"] < eval_date]
    prior_b = [b for b in history_cache.get(name_b, []) if b["date"] < eval_date]

    reach_missing = pd.isna(prof_a.get("reach_in")) or pd.isna(prof_b.get("reach_in"))
    is_debutant = (len(prior_a) == 0) or (len(prior_b) == 0)

    if not is_debutant and not reach_missing:
        quality_rating = "Verified Historical Data"
        quality_score = 95
    elif is_debutant:
        quality_rating = "Debutant Athlete (Domain Prior Imputation Applied)"
        quality_score = 70
    else:
        quality_rating = "Complete Fight Log (Reach Imputed)"
        quality_score = 85

    # Tale of the Tape side-by-side attributes using pre-fight date-aware statistics
    tape = {
        "fighter_a": {
            "name": name_a,
            "height_inches": prof_a.get("height_in"),
            "height_cm": prof_a.get("height_cm"),
            "reach_inches": prof_a.get("reach_in"),
            "reach_cm": prof_a.get("reach_cm"),
            "weight_lbs": prof_a.get("weight_lbs"),
            "stance": prof_a.get("stance", "Orthodox"),
            "prior_ufc_fights": a_stats["total_fights"],
            "prior_ufc_wins": a_stats["wins"],
            "slpm": round(a_stats["slpm"], 2),
            "sapm": round(a_stats["sapm"], 2),
            "strike_acc_pct": round(a_stats["str_acc"] * 100, 1),
            "strike_def_pct": round(a_stats["str_def"] * 100, 1),
            "takedown_avg_15m": round(a_stats["td_avg"], 2),
            "takedown_def_pct": round(a_stats["td_def"] * 100, 1)
        },
        "fighter_b": {
            "name": name_b,
            "height_inches": prof_b.get("height_in"),
            "height_cm": prof_b.get("height_cm"),
            "reach_inches": prof_b.get("reach_in"),
            "reach_cm": prof_b.get("reach_cm"),
            "weight_lbs": prof_b.get("weight_lbs"),
            "stance": prof_b.get("stance", "Orthodox"),
            "prior_ufc_fights": b_stats["total_fights"],
            "prior_ufc_wins": b_stats["wins"],
            "slpm": round(b_stats["slpm"], 2),
            "sapm": round(b_stats["sapm"], 2),
            "strike_acc_pct": round(b_stats["str_acc"] * 100, 1),
            "strike_def_pct": round(b_stats["str_def"] * 100, 1),
            "takedown_avg_15m": round(b_stats["td_avg"], 2),
            "takedown_def_pct": round(b_stats["td_def"] * 100, 1)
        }
    }

    # Top influential factor differentials based on Fighter A vs Fighter B differentials
    factors = []
    if abs(feat_ab["reach_diff"]) >= 2.0:
        adv_fighter = name_a if feat_ab["reach_diff"] > 0 else name_b
        factors.append({
            "factor": "Reach Advantage",
            "advantage_fighter": adv_fighter,
            "differential": f"{abs(feat_ab['reach_diff'])} in"
        })
    if abs(feat_ab["slpm_diff"]) >= 0.5:
        adv_fighter = name_a if feat_ab["slpm_diff"] > 0 else name_b
        factors.append({
            "factor": "Striking Output Rate",
            "advantage_fighter": adv_fighter,
            "differential": f"{abs(feat_ab['slpm_diff']):.2f} SLpM"
        })
    if abs(feat_ab["td_def_diff"]) >= 0.10:
        adv_fighter = name_a if feat_ab["td_def_diff"] > 0 else name_b
        factors.append({
            "factor": "Takedown Defense Differential",
            "advantage_fighter": adv_fighter,
            "differential": f"{abs(feat_ab['td_def_diff']) * 100:.1f}%"
        })
    if abs(feat_ab["age_diff"]) >= 3.0:
        younger = name_a if feat_ab["age_diff"] < 0 else name_b
        factors.append({
            "factor": "Youth / Age Differential",
            "advantage_fighter": younger,
            "differential": f"{abs(feat_ab['age_diff']):.1f} years younger"
        })
    if abs(feat_ab["win_streak_diff"]) >= 2:
        streak_adv = name_a if feat_ab["win_streak_diff"] > 0 else name_b
        factors.append({
            "factor": "Momentum / Win Streak",
            "advantage_fighter": streak_adv,
            "differential": f"{int(abs(feat_ab['win_streak_diff']))} fight streak diff"
        })

    return {
        "sport": "ufc_mma",
        "model_version": "ufc_v1.1",
        "predicted_winner": predicted_winner,
        "confidence_level": confidence,
        "probabilities": {
            "fighter_a": {
                "name": name_a,
                "corner": corner_a,
                "probability": round(prob_a, 4),
                "probability_percent": f"{prob_a * 100:.1f}%",
                "fair_decimal_odds": odds_a
            },
            "fighter_b": {
                "name": name_b,
                "corner": corner_b,
                "probability": round(prob_b, 4),
                "probability_percent": f"{prob_b * 100:.1f}%",
                "fair_decimal_odds": odds_b
            }
        },
        "probabilities_sum_check": round(prob_a + prob_b, 6),
        "method_probabilities": method_probs,
        "tale_of_the_tape": tape,
        "data_quality": {
            "status": quality_rating,
            "score": quality_score,
            "evaluation_date": eval_date.strftime("%Y-%m-%d"),
            "reach_recorded": not reach_missing,
            "is_title_bout": is_title_bout
        },
        "influential_factors": factors
    }

if __name__ == "__main__":
    pred = predict_ufc_bout("Jon Jones", "Daniel Cormier", is_title_bout=True)
    print("Test Prediction:")
    print(json.dumps(pred, indent=2))
