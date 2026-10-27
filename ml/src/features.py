"""
Leakage-Safe Feature Engineering Pipeline for PITCHIQ
Computes pre-match statistics, rolling form, venue-specific metrics,
rest days, and head-to-head history strictly prior to kickoff.
"""

import json
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"

FEATURE_COLUMNS = [
    "home_points_roll5",
    "away_points_roll5",
    "home_ppg_roll5",
    "away_ppg_roll5",
    "home_goals_scored_roll5",
    "away_goals_scored_roll5",
    "home_goals_conceded_roll5",
    "away_goals_conceded_roll5",
    "home_goal_diff_roll5",
    "away_goal_diff_roll5",
    "home_shots_target_roll5",
    "away_shots_target_roll5",
    "home_team_home_ppg_roll5",
    "away_team_away_ppg_roll5",
    "home_team_home_win_rate_roll5",
    "away_team_away_win_rate_roll5",
    "home_days_since_last_match",
    "away_days_since_last_match",
    "rest_diff_days",
    "points_diff_roll5",
    "goal_diff_comparison",
    "ppg_diff_roll5",
    "h2h_home_wins",
    "h2h_draws",
    "h2h_away_wins"
]

def get_team_history_before_date(df: pd.DataFrame, team: str, before_date: pd.Timestamp) -> list[dict]:
    """
    Extracts all past matches involving `team` strictly occurring before `before_date`.
    Ensures complete chronological ordering and isolation from future data.
    """
    prior_matches = df[(df["Date"] < before_date) & ((df["HomeTeam"] == team) | (df["AwayTeam"] == team))].copy()
    prior_matches = prior_matches.sort_values(by="Date", ascending=True)

    records = []
    for _, row in prior_matches.iterrows():
        is_home = (row["HomeTeam"] == team)
        team_goals = int(row["FTHG"] if is_home else row["FTAG"])
        opp_goals = int(row["FTAG"] if is_home else row["FTHG"])
        team_shots_target = int(row.get("HST" if is_home else "AST", 0))

        if team_goals > opp_goals:
            res = "W"
            points = 3
        elif team_goals == opp_goals:
            res = "D"
            points = 1
        else:
            res = "L"
            points = 0

        records.append({
            "date": row["Date"],
            "opponent": row["AwayTeam"] if is_home else row["HomeTeam"],
            "is_home": is_home,
            "team_goals": team_goals,
            "opp_goals": opp_goals,
            "goal_diff": team_goals - opp_goals,
            "shots_target": team_shots_target,
            "result": res,
            "points": points
        })
    return records

def compute_rolling_stats(history: list[dict], match_date: pd.Timestamp, window: int = 5) -> dict:
    """
    Computes rolling metrics over the last `window` matches strictly prior to match_date.
    """
    if not history:
        return {
            "matches_played": 0,
            "points_roll": 0.0,
            "ppg_roll": 1.0,  # neutral default
            "goals_scored_roll": 0.0,
            "goals_conceded_roll": 0.0,
            "goal_diff_roll": 0.0,
            "shots_target_roll": 0.0,
            "venue_ppg_roll": 1.0,
            "venue_win_rate_roll": 0.33,
            "days_since_last_match": 14.0,  # standard off-season / break default
            "recent_form": []
        }

    recent = history[-window:]
    n = len(recent)
    points = sum(m["points"] for m in recent)
    ppg = points / n if n > 0 else 1.0
    gs = sum(m["team_goals"] for m in recent)
    gc = sum(m["opp_goals"] for m in recent)
    gd = gs - gc
    st = sum(m["shots_target"] for m in recent)

    # Days since last match
    last_match_date = history[-1]["date"]
    days_since = max(1.0, min(60.0, (match_date - last_match_date).total_seconds() / 86400.0))

    # Venue specific
    return {
        "matches_played": len(history),
        "points_roll": float(points),
        "ppg_roll": float(round(ppg, 3)),
        "goals_scored_roll": float(gs),
        "goals_conceded_roll": float(gc),
        "goal_diff_roll": float(gd),
        "shots_target_roll": float(st),
        "days_since_last_match": float(round(days_since, 1)),
        "recent_form": [m["result"] for m in recent]
    }

def compute_venue_rolling_stats(history: list[dict], is_home_venue: bool, window: int = 5) -> dict:
    """
    Computes venue-specific form (home performance for home team, away performance for away team).
    """
    venue_matches = [m for m in history if m["is_home"] == is_home_venue]
    if not venue_matches:
        return {"venue_ppg_roll": 1.0, "venue_win_rate_roll": 0.33}
    
    recent_venue = venue_matches[-window:]
    nv = len(recent_venue)
    v_points = sum(m["points"] for m in recent_venue)
    v_ppg = v_points / nv if nv > 0 else 1.0
    v_wins = sum(1 for m in recent_venue if m["result"] == "W")
    v_win_rate = v_wins / nv if nv > 0 else 0.33

    return {
        "venue_ppg_roll": float(round(v_ppg, 3)),
        "venue_win_rate_roll": float(round(v_win_rate, 3))
    }

def compute_h2h_stats(df: pd.DataFrame, home_team: str, away_team: str, before_date: pd.Timestamp, h2h_window: int = 3) -> dict:
    """Computes Head-to-Head stats in encounters strictly before before_date."""
    mask = (df["Date"] < before_date) & (
        ((df["HomeTeam"] == home_team) & (df["AwayTeam"] == away_team)) |
        ((df["HomeTeam"] == away_team) & (df["AwayTeam"] == home_team))
    )
    h2h_matches = df[mask].sort_values(by="Date", ascending=True)
    if h2h_matches.empty:
        return {"h2h_home_wins": 0, "h2h_draws": 0, "h2h_away_wins": 0}

    recent_h2h = h2h_matches.tail(h2h_window)
    home_w = 0
    draws = 0
    away_w = 0
    for _, row in recent_h2h.iterrows():
        if row["FTR"] == "D":
            draws += 1
        elif (row["HomeTeam"] == home_team and row["FTR"] == "H") or (row["AwayTeam"] == home_team and row["FTR"] == "A"):
            home_w += 1
        else:
            away_w += 1

    return {"h2h_home_wins": home_w, "h2h_draws": draws, "h2h_away_wins": away_w}

def build_feature_vector(
    historical_df: pd.DataFrame,
    home_team: str,
    away_team: str,
    match_date: pd.Timestamp,
    window: int = 5
) -> dict:
    """
    Constructs a complete pre-match feature set for any fixture (historical or future).
    Guarantees zero target leakage.
    """
    home_hist = get_team_history_before_date(historical_df, home_team, match_date)
    away_hist = get_team_history_before_date(historical_df, away_team, match_date)

    h_roll = compute_rolling_stats(home_hist, match_date, window=window)
    a_roll = compute_rolling_stats(away_hist, match_date, window=window)

    h_venue = compute_venue_rolling_stats(home_hist, is_home_venue=True, window=window)
    a_venue = compute_venue_rolling_stats(away_hist, is_home_venue=False, window=window)

    h2h = compute_h2h_stats(historical_df, home_team, away_team, match_date)

    rest_diff = round(h_roll["days_since_last_match"] - a_roll["days_since_last_match"], 1)
    points_diff = round(h_roll["points_roll"] - a_roll["points_roll"], 2)
    gd_diff = round(h_roll["goal_diff_roll"] - a_roll["goal_diff_roll"], 2)
    ppg_diff = round(h_roll["ppg_roll"] - a_roll["ppg_roll"], 3)

    return {
        "home_team": home_team,
        "away_team": away_team,
        "match_date": match_date.strftime("%Y-%m-%d"),
        "home_matches_played": h_roll["matches_played"],
        "away_matches_played": a_roll["matches_played"],
        "home_form_wld": h_roll["recent_form"],
        "away_form_wld": a_roll["recent_form"],
        # Model input features:
        "home_points_roll5": h_roll["points_roll"],
        "away_points_roll5": a_roll["points_roll"],
        "home_ppg_roll5": h_roll["ppg_roll"],
        "away_ppg_roll5": a_roll["ppg_roll"],
        "home_goals_scored_roll5": h_roll["goals_scored_roll"],
        "away_goals_scored_roll5": a_roll["goals_scored_roll"],
        "home_goals_conceded_roll5": h_roll["goals_conceded_roll"],
        "away_goals_conceded_roll5": a_roll["goals_conceded_roll"],
        "home_goal_diff_roll5": h_roll["goal_diff_roll"],
        "away_goal_diff_roll5": a_roll["goal_diff_roll"],
        "home_shots_target_roll5": h_roll["shots_target_roll"],
        "away_shots_target_roll5": a_roll["shots_target_roll"],
        "home_team_home_ppg_roll5": h_venue["venue_ppg_roll"],
        "away_team_away_ppg_roll5": a_venue["venue_ppg_roll"],
        "home_team_home_win_rate_roll5": h_venue["venue_win_rate_roll"],
        "away_team_away_win_rate_roll5": a_venue["venue_win_rate_roll"],
        "home_days_since_last_match": h_roll["days_since_last_match"],
        "away_days_since_last_match": a_roll["days_since_last_match"],
        "rest_diff_days": rest_diff,
        "points_diff_roll5": points_diff,
        "goal_diff_comparison": gd_diff,
        "ppg_diff_roll5": ppg_diff,
        "h2h_home_wins": h2h["h2h_home_wins"],
        "h2h_draws": h2h["h2h_draws"],
        "h2h_away_wins": h2h["h2h_away_wins"]
    }

def generate_training_feature_dataset(clean_df: pd.DataFrame, min_team_matches: int = 3) -> pd.DataFrame:
    """
    Generates feature rows for all historical matches where both teams have at least min_team_matches.
    Sorted strictly chronologically.
    """
    clean_df = clean_df.sort_values(by=["Date", "HomeTeam"]).reset_index(drop=True)
    rows = []

    for idx, row in clean_df.iterrows():
        match_date = pd.to_datetime(row["Date"])
        h_team = str(row["HomeTeam"]).strip()
        a_team = str(row["AwayTeam"]).strip()
        ftr = str(row["FTR"]).strip().upper()

        feat_dict = build_feature_vector(clean_df, h_team, a_team, match_date)

        # Only retain for training if both teams have prior history
        if feat_dict["home_matches_played"] >= min_team_matches and feat_dict["away_matches_played"] >= min_team_matches:
            feat_dict["target"] = ftr
            feat_dict["FTHG"] = int(row["FTHG"])
            feat_dict["FTAG"] = int(row["FTAG"])
            feat_dict["SeasonCode"] = row["SeasonCode"]
            rows.append(feat_dict)

    feat_df = pd.DataFrame(rows)
    feat_output_path = PROCESSED_DATA_DIR / "features_engineered.csv"
    feat_df.to_csv(feat_output_path, index=False)
    return feat_df

if __name__ == "__main__":
    matches_csv = PROCESSED_DATA_DIR / "matches_clean.csv"
    if matches_csv.exists():
        df = pd.read_csv(matches_csv)
        df["Date"] = pd.to_datetime(df["Date"])
        feat_df = generate_training_feature_dataset(df)
        print("Engineered feature rows:", len(feat_df))
        print("Sample row:")
        print(feat_df.iloc[0][FEATURE_COLUMNS].to_dict())
    else:
        print("Clean matches CSV not found. Please run validation.py first.")
