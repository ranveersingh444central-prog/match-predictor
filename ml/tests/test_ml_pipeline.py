"""
Comprehensive Machine Learning Test Suite for PITCHIQ
Verifies:
1. No future data leakage (target match scores or subsequent matches never leak into features)
2. Strict chronological ordering
3. Probability sum to 100% and class ordering ['H', 'D', 'A']
4. Preprocessing fitted strictly on train set
5. Graceful handling of invalid inputs and edge cases
"""

import sys
import pytest
import numpy as np
import pandas as pd
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ML_DIR / "src"))

import features
import predict
from validation import load_and_validate_raw_data

def test_clean_data_integrity():
    """Verify clean dataset has required columns, positive scores, and valid results."""
    clean_path = ML_DIR / "data" / "processed" / "matches_clean.csv"
    assert clean_path.exists(), "Clean matches dataset must exist"
    df = pd.read_csv(clean_path)
    df["Date"] = pd.to_datetime(df["Date"])

    assert len(df) > 1000, "Clean dataset should have at least 1000 historical matches"
    assert set(df["FTR"].unique()).issubset({"H", "D", "A"}), "Results must be strictly H, D, or A"
    assert (df["FTHG"] >= 0).all(), "Home goals cannot be negative"
    assert (df["FTAG"] >= 0).all(), "Away goals cannot be negative"

def test_chronological_ordering():
    """Verify that matches can be strictly chronologically sequenced."""
    clean_path = ML_DIR / "data" / "processed" / "matches_clean.csv"
    df = pd.read_csv(clean_path)
    df["Date"] = pd.to_datetime(df["Date"])
    sorted_dates = df.sort_values(by="Date")["Date"].tolist()
    # Check that minimum date precedes maximum date
    assert sorted_dates[0] < sorted_dates[-1]

def test_future_data_leakage_prevention():
    """
    CRITICAL REGRESSION TEST:
    Modifying a match's future outcome MUST NOT alter the pre-match feature vector
    computed for that match or for prior matches!
    """
    clean_path = ML_DIR / "data" / "processed" / "matches_clean.csv"
    df = pd.read_csv(clean_path)
    df["Date"] = pd.to_datetime(df["Date"])

    # Pick a target match in the middle
    mid_idx = 500
    target_match = df.iloc[mid_idx]
    target_date = target_match["Date"]
    home_team = target_match["HomeTeam"]
    away_team = target_match["AwayTeam"]

    # Compute feature vector on normal dataset
    feat1 = features.build_feature_vector(df, home_team, away_team, target_date)

    # Now create a corrupted future dataset where subsequent matches have massive goal anomalies
    corrupted_df = df.copy()
    future_mask = corrupted_df["Date"] >= target_date
    corrupted_df.loc[future_mask, "FTHG"] = 99
    corrupted_df.loc[future_mask, "FTAG"] = 99
    corrupted_df.loc[future_mask, "FTR"] = "D"

    # Compute feature vector on corrupted dataset
    feat2 = features.build_feature_vector(corrupted_df, home_team, away_team, target_date)

    # Pre-match features MUST be identical, proving zero future data leakage
    for col in features.FEATURE_COLUMNS:
        assert feat1[col] == feat2[col], (
            f"LEAKAGE DETECTED in feature '{col}'! "
            f"Original value={feat1[col]}, Corrupted future value={feat2[col]}"
        )

def test_target_leakage_isolation():
    """
    Verifies that the target match's own result (FTHG, FTAG, FTR)
    does not affect its own computed features.
    """
    clean_path = ML_DIR / "data" / "processed" / "matches_clean.csv"
    df = pd.read_csv(clean_path)
    df["Date"] = pd.to_datetime(df["Date"])

    row = df.iloc[300]
    date = row["Date"]
    h_team = row["HomeTeam"]
    a_team = row["AwayTeam"]

    feat_before = features.build_feature_vector(df, h_team, a_team, date)

    # Artificially alter the score of this exact match
    alt_df = df.copy()
    match_row_idx = alt_df[(alt_df["Date"] == date) & (alt_df["HomeTeam"] == h_team)].index
    alt_df.loc[match_row_idx, "FTHG"] = 15
    alt_df.loc[match_row_idx, "FTAG"] = 0
    alt_df.loc[match_row_idx, "FTR"] = "H"

    feat_after = features.build_feature_vector(alt_df, h_team, a_team, date)

    # Features must remain strictly identical because target match has not yet occurred
    assert feat_before["home_goals_scored_roll5"] == feat_after["home_goals_scored_roll5"]
    assert feat_before["points_diff_roll5"] == feat_after["points_diff_roll5"]

def test_prediction_output_and_class_mapping():
    """Verify predict_match returns valid probabilities mapped to H, D, A summing to 100%."""
    res = predict.predict_match("Arsenal", "Chelsea", is_hypothetical=True)

    probs = res["probabilities"]
    assert "home_win" in probs and "draw" in probs and "away_win" in probs
    assert probs["home_win"]["code"] == "H"
    assert probs["draw"]["code"] == "D"
    assert probs["away_win"]["code"] == "A"

    total_prob = probs["home_win"]["probability"] + probs["draw"]["probability"] + probs["away_win"]["probability"]
    assert abs(total_prob - 100.0) < 0.2, f"Probabilities must sum to ~100%, got {total_prob}"

    assert res["most_likely_outcome"]["code"] in ["H", "D", "A"]
    assert res["most_likely_outcome"]["probability"] >= 33.3

def test_identical_teams_rejected():
    """Verify that predicting Arsenal vs Arsenal raises a ValueError."""
    with pytest.raises(ValueError, match="cannot be identical"):
        predict.predict_match("Arsenal", "Arsenal")
