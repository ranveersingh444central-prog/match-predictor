"""
Inference and Match Prediction Service for PITCHIQ
Executes leakage-safe predictions for upcoming fixtures and hypothetical matchups.
Provides probability distribution, explainability breakdown, and prediction audit tracking.
"""

import os
import json
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
HISTORY_FILE = BASE_DIR / "data" / "prediction_history.json"

from features import FEATURE_COLUMNS, build_feature_vector

_MODEL_CACHE = None
_METADATA_CACHE = None

def get_model_and_metadata():
    """Loads and caches the model artifact and metadata."""
    global _MODEL_CACHE, _METADATA_CACHE
    if _MODEL_CACHE is None or _METADATA_CACHE is None:
        model_path = ARTIFACTS_DIR / "model.joblib"
        meta_path = ARTIFACTS_DIR / "model_metadata.json"
        if not model_path.exists() or not meta_path.exists():
            raise FileNotFoundError("Model artifacts not found. Please run train.py first.")
        _MODEL_CACHE = joblib.load(model_path)
        with open(meta_path, "r", encoding="utf-8") as f:
            _METADATA_CACHE = json.load(f)
    return _MODEL_CACHE, _METADATA_CACHE

def record_prediction_history(record: dict):
    """Appends prediction record for audit and future evaluation against completed matches."""
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    history = []
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            history = []
    history.append(record)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

def predict_match(
    home_team: str,
    away_team: str,
    match_date: str = None,
    fixture_id: str = None,
    competition: str = "Premier League",
    is_hypothetical: bool = False
) -> dict:
    """
    Generates a leakage-safe prediction using pre-match statistics.
    Returns:
    - Probability of Home Win (H), Draw (D), Away Win (A)
    - Key form and statistical drivers
    - Model metadata and prediction timestamp
    """
    model, metadata = get_model_and_metadata()

    # Input validation
    clean_home = home_team.strip()
    clean_away = away_team.strip()

    if clean_home.lower() == clean_away.lower():
        raise ValueError("Home team and Away team cannot be identical.")

    matches_csv = PROCESSED_DATA_DIR / "matches_clean.csv"
    if not matches_csv.exists():
        raise FileNotFoundError("Clean matches data not found. Please run validation.py first.")

    matches_df = pd.read_csv(matches_csv)
    matches_df["Date"] = pd.to_datetime(matches_df["Date"])

    all_teams = set(matches_df["HomeTeam"].unique()) | set(matches_df["AwayTeam"].unique())
    if clean_home not in all_teams:
        raise ValueError(f"Home team '{clean_home}' not recognized in dataset. Supported teams: {sorted(list(all_teams))[:5]}...")
    if clean_away not in all_teams:
        raise ValueError(f"Away team '{clean_away}' not recognized in dataset. Supported teams: {sorted(list(all_teams))[:5]}...")

    # Determine reference date for features
    if match_date:
        try:
            ref_date = pd.to_datetime(match_date)
        except Exception:
            ref_date = pd.Timestamp.now()
    else:
        # Default to immediately after the latest known match in the dataset
        ref_date = matches_df["Date"].max() + pd.Timedelta(days=1)

    # Compute leakage-free feature vector
    feat_dict = build_feature_vector(matches_df, clean_home, clean_away, ref_date)

    # Check sufficient match history
    if feat_dict["home_matches_played"] < 3 or feat_dict["away_matches_played"] < 3:
        raise ValueError(
            f"Insufficient historical match history prior to {ref_date.strftime('%Y-%m-%d')} for "
            f"{clean_home} ({feat_dict['home_matches_played']} matches) or "
            f"{clean_away} ({feat_dict['away_matches_played']} matches). At least 3 prior matches required."
        )

    # Build input DataFrame
    input_row = pd.DataFrame([{col: feat_dict[col] for col in FEATURE_COLUMNS}])

    # Model inference
    proba = model.predict_proba(input_row)[0]
    classes = model.named_steps["classifier"].classes_

    # Map explicitly to H: 0, D: 1, A: 2
    prob_map = {0: 0.0, 1: 0.0, 2: 0.0}
    for model_idx, orig_class_idx in enumerate(classes):
        prob_map[orig_class_idx] = float(proba[model_idx])

    # Convert to percentages
    h_prob = round(prob_map[0] * 100, 1)
    d_prob = round(prob_map[1] * 100, 1)
    a_prob = round(prob_map[2] * 100, 1)

    # Adjust rounding if needed to sum to 100.0%
    diff = round(100.0 - (h_prob + d_prob + a_prob), 1)
    if diff != 0:
        h_prob = round(h_prob + diff, 1)

    # Identify outcome with highest estimated probability
    max_prob = max(h_prob, d_prob, a_prob)
    if max_prob == h_prob:
        most_likely = "Home Win"
        most_likely_code = "H"
    elif max_prob == a_prob:
        most_likely = "Away Win"
        most_likely_code = "A"
    else:
        most_likely = "Draw"
        most_likely_code = "D"

    # Explainability & feature comparisons
    explanation = {
        "home_points_last_5": feat_dict["home_points_roll5"],
        "away_points_last_5": feat_dict["away_points_roll5"],
        "home_form": feat_dict["home_form_wld"],
        "away_form": feat_dict["away_form_wld"],
        "home_goals_scored_last_5": feat_dict["home_goals_scored_roll5"],
        "away_goals_scored_last_5": feat_dict["away_goals_scored_roll5"],
        "home_goals_conceded_last_5": feat_dict["home_goals_conceded_roll5"],
        "away_goals_conceded_last_5": feat_dict["away_goals_conceded_roll5"],
        "home_team_home_ppg": feat_dict["home_team_home_ppg_roll5"],
        "away_team_away_ppg": feat_dict["away_team_away_ppg_roll5"],
        "rest_advantage_days": feat_dict["rest_diff_days"],
        "h2h_summary": {
            "home_wins": feat_dict["h2h_home_wins"],
            "draws": feat_dict["h2h_draws"],
            "away_wins": feat_dict["h2h_away_wins"]
        }
    }

    prediction_id = fixture_id or f"pred_{clean_home[:3]}_{clean_away[:3]}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    response = {
        "prediction_id": prediction_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "competition": competition,
        "home_team": clean_home,
        "away_team": clean_away,
        "scheduled_date": ref_date.strftime("%Y-%m-%d"),
        "is_hypothetical": is_hypothetical,
        "probabilities": {
            "home_win": {"code": "H", "label": "Home Win", "probability": h_prob, "raw": round(prob_map[0], 4)},
            "draw": {"code": "D", "label": "Draw", "probability": d_prob, "raw": round(prob_map[1], 4)},
            "away_win": {"code": "A", "label": "Away Win", "probability": a_prob, "raw": round(prob_map[2], 4)}
        },
        "most_likely_outcome": {
            "code": most_likely_code,
            "label": most_likely,
            "probability": max_prob
        },
        "key_statistics": explanation,
        "model_version": metadata.get("model_name", "Random Forest"),
        "model_training_period": metadata.get("training_period", "Historical"),
        "confidence_note": "Probabilistic estimate based strictly on pre-match historical team form and schedule dynamics. Football match outcomes carry inherent variance."
    }

    # Save to history log
    record_prediction_history(response)

    return response

if __name__ == "__main__":
    res = predict_match("Arsenal", "Chelsea", is_hypothetical=True)
    print("Sample Prediction Output:")
    print(json.dumps(res, indent=2))
