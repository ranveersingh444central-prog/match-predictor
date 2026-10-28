"""
Comprehensive Machine Learning Test Suite for PITCHIQ UFC / MMA Subsystem
Verifies:
1. UFC raw data provenance and clean dataset integrity
2. Zero future-data leakage (altering future bouts does not change pre-fight features)
3. Zero target leakage (altering the target bout's outcome or in-fight stats does not change its pre-fight features)
4. Zero static-profile leakage (altering static 2021 career totals does not affect historical features)
5. Debutant handling, neutral domain baselines, and missing value resilience
6. Model artifact persistence, schema validation, and calibration
7. Probabilities sum to 100% and decimal odds consistency
8. Error handling for invalid/identical fighters
"""

import sys
import pytest
import numpy as np
import pandas as pd
from pathlib import Path

# Setup paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ML_DIR = ROOT_DIR / "ml"
sys.path.insert(0, str(ML_DIR / "src" / "ufc"))

import ufc_features
import ufc_predict
from ufc_features import FEATURE_COLUMNS, build_single_fight_feature_vector

def test_ufc_raw_data_and_provenance():
    """Verify raw files exist, have non-zero size, and provenance record is valid."""
    raw_dir = ML_DIR / "data" / "ufc" / "raw"
    fights_raw = raw_dir / "raw_total_fight_data.csv"
    fighters_raw = raw_dir / "raw_fighter_details.csv"
    provenance = raw_dir / "ufc_provenance.json"

    assert fights_raw.exists() and fights_raw.stat().st_size > 1_000_000, "Raw fights CSV must exist"
    assert fighters_raw.exists() and fighters_raw.stat().st_size > 100_000, "Raw fighters CSV must exist"
    assert provenance.exists(), "Provenance JSON must be documented"

    import json
    with open(provenance, "r", encoding="utf-8") as f:
        meta = json.load(f)
    assert "license" in meta and "Public Domain" in meta["license"], "License must be Public Domain / CC0"

def test_ufc_clean_data_integrity():
    """Verify processed datasets conform to schema, date bounds, and outcome mappings."""
    processed_dir = ML_DIR / "data" / "ufc" / "processed"
    fights_clean = processed_dir / "fights_clean.csv"
    fighters_clean = processed_dir / "fighters_clean.csv"

    assert fights_clean.exists(), "fights_clean.csv must exist"
    assert fighters_clean.exists(), "fighters_clean.csv must exist"

    df_fights = pd.read_csv(fights_clean)
    df_fighters = pd.read_csv(fighters_clean)

    assert len(df_fights) >= 5900, "Should retain at least 5,900 valid bouts"
    assert len(df_fighters) >= 3500, "Should retain at least 3,500 fighter profiles"

    # Outcome target validation
    assert set(df_fights["result_target"].unique()).issubset({"Red", "Blue", "Draw/NC"})
    assert set(df_fights["winner_code"].unique()).issubset({1, 0, -1})

    # Dates are non-null and chronologically bounded
    df_fights["date"] = pd.to_datetime(df_fights["date"])
    assert df_fights["date"].isna().sum() == 0, "No null dates allowed"
    assert df_fights["date"].min() == pd.to_datetime("1994-03-11")

def test_ufc_future_bouts_cannot_change_earlier_features():
    """
    CRITICAL ANTI-LEAKAGE REGRESSION TEST 1:
    Verifies that future bouts (t > target_date) CANNOT alter the pre-fight
    feature vector computed for an earlier bout.
    """
    _, _, _, profiles_dict, _ = ufc_predict.get_cached_ufc_resources()

    target_date = pd.to_datetime("2018-07-07")
    red_fighter = "Daniel Cormier"
    blue_fighter = "Stipe Miocic"

    # Baseline prior history strictly before target_date
    red_prior_true = [
        {"date": pd.to_datetime("2015-01-03"), "won": 0, "method": "Decision", "is_title": True, "mins": 25.0, "sig_landed": 58, "sig_att": 110, "sig_abs": 92, "sig_opp_att": 160, "td_landed": 1, "td_att": 8, "td_abs": 3, "td_opp_att": 5, "sub_att": 0},
        {"date": pd.to_datetime("2015-05-23"), "won": 1, "method": "Submission", "is_title": True, "mins": 14.5, "sig_landed": 45, "sig_att": 80, "sig_abs": 30, "sig_opp_att": 60, "td_landed": 3, "td_att": 5, "td_abs": 0, "td_opp_att": 1, "sub_att": 1},
        {"date": pd.to_datetime("2018-01-20"), "won": 1, "method": "KO/TKO", "is_title": True, "mins": 7.0, "sig_landed": 35, "sig_att": 50, "sig_abs": 15, "sig_opp_att": 35, "td_landed": 2, "td_att": 3, "td_abs": 0, "td_opp_att": 0, "sub_att": 0}
    ]
    blue_prior_true = [
        {"date": pd.to_datetime("2016-05-14"), "won": 1, "method": "KO/TKO", "is_title": True, "mins": 2.8, "sig_landed": 20, "sig_att": 30, "sig_abs": 8, "sig_opp_att": 15, "td_landed": 0, "td_att": 0, "td_abs": 0, "td_opp_att": 0, "sub_att": 0},
        {"date": pd.to_datetime("2018-01-20"), "won": 1, "method": "Decision", "is_title": True, "mins": 25.0, "sig_landed": 70, "sig_att": 130, "sig_abs": 40, "sig_opp_att": 90, "td_landed": 6, "td_att": 14, "td_abs": 0, "td_opp_att": 0, "sub_att": 0}
    ]

    feat_baseline = build_single_fight_feature_vector(
        red_name=red_fighter,
        blue_name=blue_fighter,
        target_date=target_date,
        red_prior_bouts=red_prior_true,
        blue_prior_bouts=blue_prior_true,
        profiles_dict=profiles_dict,
        is_title_bout=True
    )

    # Inject extreme future bouts occurring AFTER target_date
    red_corrupted = list(red_prior_true) + [
        {"date": pd.to_datetime("2019-08-17"), "won": 99, "method": "KO/TKO", "is_title": True, "mins": 20.0, "sig_landed": 500, "sig_att": 900, "sig_abs": 1, "sig_opp_att": 10, "td_landed": 50, "td_att": 50, "td_abs": 0, "td_opp_att": 0, "sub_att": 10},
        {"date": pd.to_datetime("2020-08-15"), "won": -99, "method": "Decision", "is_title": True, "mins": 25.0, "sig_landed": 1000, "sig_att": 2000, "sig_abs": 0, "sig_opp_att": 0, "td_landed": 100, "td_att": 100, "td_abs": 0, "td_opp_att": 0, "sub_att": 20}
    ]
    blue_corrupted = list(blue_prior_true) + [
        {"date": pd.to_datetime("2019-08-17"), "won": 99, "method": "KO/TKO", "is_title": True, "mins": 20.0, "sig_landed": 400, "sig_att": 800, "sig_abs": 1, "sig_opp_att": 10, "td_landed": 40, "td_att": 40, "td_abs": 0, "td_opp_att": 0, "sub_att": 5}
    ]

    feat_corrupted = build_single_fight_feature_vector(
        red_name=red_fighter,
        blue_name=blue_fighter,
        target_date=target_date,
        red_prior_bouts=red_corrupted,
        blue_prior_bouts=blue_corrupted,
        profiles_dict=profiles_dict,
        is_title_bout=True
    )

    for col in FEATURE_COLUMNS:
        assert feat_baseline[col] == feat_corrupted[col], (
            f"LEAKAGE DETECTED in feature '{col}'! Baseline={feat_baseline[col]}, Corrupted={feat_corrupted[col]}"
        )

def test_ufc_target_bout_stats_cannot_change_own_pre_fight_features():
    """
    CRITICAL ANTI-LEAKAGE REGRESSION TEST 2:
    Verifies that modifying the target bout's own outcome or in-fight statistics
    CANNOT alter its own pre-fight feature vector.
    """
    _, _, _, profiles_dict, _ = ufc_predict.get_cached_ufc_resources()

    target_date = pd.to_datetime("2019-11-02")
    red_fighter = "Jorge Masvidal"
    blue_fighter = "Nate Diaz"

    prior_bouts_r = [
        {"date": pd.to_datetime("2019-03-16"), "won": 1, "method": "KO/TKO", "is_title": False, "mins": 6.5, "sig_landed": 30, "sig_att": 50, "sig_abs": 20, "sig_opp_att": 40, "td_landed": 0, "td_att": 0, "td_abs": 0, "td_opp_att": 0, "sub_att": 0},
        {"date": pd.to_datetime("2019-07-06"), "won": 1, "method": "KO/TKO", "is_title": False, "mins": 0.1, "sig_landed": 3, "sig_att": 3, "sig_abs": 0, "sig_opp_att": 0, "td_landed": 0, "td_att": 0, "td_abs": 0, "td_opp_att": 0, "sub_att": 0}
    ]
    prior_bouts_b = [
        {"date": pd.to_datetime("2016-08-20"), "won": 0, "method": "Decision", "is_title": False, "mins": 25.0, "sig_landed": 120, "sig_att": 250, "sig_abs": 110, "sig_opp_att": 230, "td_landed": 0, "td_att": 3, "td_abs": 0, "td_opp_att": 0, "sub_att": 0},
        {"date": pd.to_datetime("2019-08-17"), "won": 1, "method": "Decision", "is_title": False, "mins": 15.0, "sig_landed": 80, "sig_att": 160, "sig_abs": 45, "sig_opp_att": 90, "td_landed": 1, "td_att": 2, "td_abs": 0, "td_opp_att": 1, "sub_att": 0}
    ]

    feat_before = build_single_fight_feature_vector(
        red_name=red_fighter,
        blue_name=blue_fighter,
        target_date=target_date,
        red_prior_bouts=prior_bouts_r,
        blue_prior_bouts=prior_bouts_b,
        profiles_dict=profiles_dict,
        is_title_bout=False
    )

    # Now add the target bout itself with an extreme in-fight score at target_date
    corrupted_with_target_bout = list(prior_bouts_r) + [
        {"date": target_date, "won": 0, "method": "KO/TKO", "is_title": False, "mins": 15.0, "sig_landed": 999, "sig_att": 999, "sig_abs": 0, "sig_opp_att": 0, "td_landed": 99, "td_att": 99, "td_abs": 0, "td_opp_att": 0, "sub_att": 99}
    ]

    feat_after = build_single_fight_feature_vector(
        red_name=red_fighter,
        blue_name=blue_fighter,
        target_date=target_date,
        red_prior_bouts=corrupted_with_target_bout,
        blue_prior_bouts=prior_bouts_b,
        profiles_dict=profiles_dict,
        is_title_bout=False
    )

    # Since the target bout has date == target_date, it MUST NOT enter the pre-fight vector
    for col in FEATURE_COLUMNS:
        assert feat_before[col] == feat_after[col], f"SELF-TARGET LEAKAGE in '{col}'!"

def test_ufc_static_career_averages_isolated_from_historical_features():
    """
    CRITICAL ANTI-LEAKAGE REGRESSION TEST 3 (Phase 3.1):
    Proves that modifying static 2021 career rates (SLpM, SApM, Str_Acc, Str_Def, TD_Avg, TD_Def, Sub_Avg)
    in the fighter profile dictionary CANNOT alter historical pre-fight feature vectors!
    """
    _, _, _, profiles_dict, _ = ufc_predict.get_cached_ufc_resources()

    target_date = pd.to_datetime("2015-01-03")
    red_fighter = "Jon Jones"
    blue_fighter = "Daniel Cormier"

    prior_r = [
        {"date": pd.to_datetime("2013-09-21"), "won": 1, "method": "Decision", "is_title": True, "mins": 25.0, "sig_landed": 134, "sig_att": 230, "sig_abs": 110, "sig_opp_att": 210, "td_landed": 1, "td_att": 5, "td_abs": 1, "td_opp_att": 2, "sub_att": 0},
        {"date": pd.to_datetime("2014-04-26"), "won": 1, "method": "Decision", "is_title": True, "mins": 25.0, "sig_landed": 113, "sig_att": 190, "sig_abs": 60, "sig_opp_att": 140, "td_landed": 2, "td_att": 4, "td_abs": 0, "td_opp_att": 0, "sub_att": 0}
    ]
    prior_b = [
        {"date": pd.to_datetime("2014-02-22"), "won": 1, "method": "KO/TKO", "is_title": False, "mins": 1.3, "sig_landed": 25, "sig_att": 35, "sig_abs": 2, "sig_opp_att": 5, "td_landed": 1, "td_att": 1, "td_abs": 0, "td_opp_att": 0, "sub_att": 0},
        {"date": pd.to_datetime("2014-05-24"), "won": 1, "method": "Submission", "is_title": False, "mins": 13.8, "sig_landed": 45, "sig_att": 70, "sig_abs": 12, "sig_opp_att": 30, "td_landed": 4, "td_att": 6, "td_abs": 0, "td_opp_att": 0, "sub_att": 1}
    ]

    # Clean feature vector with unmodified profiles
    feat_original = build_single_fight_feature_vector(
        red_name=red_fighter,
        blue_name=blue_fighter,
        target_date=target_date,
        red_prior_bouts=prior_r,
        blue_prior_bouts=prior_b,
        profiles_dict=profiles_dict,
        is_title_bout=True
    )

    # Create artificially corrupted static profiles with 999.0 career totals
    corrupted_profiles = dict(profiles_dict)
    corrupted_profiles[red_fighter] = dict(profiles_dict.get(red_fighter, {}))
    corrupted_profiles[red_fighter]["SLpM"] = 999.0
    corrupted_profiles[red_fighter]["SApM"] = 999.0
    corrupted_profiles[red_fighter]["Str_Acc"] = 0.99
    corrupted_profiles[red_fighter]["Str_Def"] = 0.99
    corrupted_profiles[red_fighter]["TD_Avg"] = 99.0
    corrupted_profiles[red_fighter]["TD_Def"] = 0.99
    corrupted_profiles[red_fighter]["Sub_Avg"] = 99.0

    feat_with_altered_profiles = build_single_fight_feature_vector(
        red_name=red_fighter,
        blue_name=blue_fighter,
        target_date=target_date,
        red_prior_bouts=prior_r,
        blue_prior_bouts=prior_b,
        profiles_dict=corrupted_profiles,
        is_title_bout=True
    )

    # The 7 rate differentials MUST remain 100% strictly identical
    isolated_rate_cols = [
        "slpm_diff", "sapm_diff", "str_acc_diff", "str_def_diff",
        "td_avg_diff", "td_def_diff", "sub_avg_diff"
    ]
    for col in isolated_rate_cols:
        assert feat_original[col] == feat_with_altered_profiles[col], (
            f"STATIC PROFILE LEAKAGE DETECTED in '{col}'! "
            f"Original={feat_original[col]}, Altered={feat_with_altered_profiles[col]}"
        )

def test_ufc_debutant_and_missing_statistics_handling():
    """Verify that debutant athletes with zero prior bouts receive neutral domain priors with zero NaNs."""
    _, _, _, profiles_dict, _ = ufc_predict.get_cached_ufc_resources()

    feat = build_single_fight_feature_vector(
        red_name="Jon Jones",
        blue_name="Demian Maia",
        target_date=pd.to_datetime("2020-01-01"),
        red_prior_bouts=[],  # Debutant Red
        blue_prior_bouts=[], # Debutant Blue
        profiles_dict=profiles_dict,
        is_title_bout=False
    )

    assert feat["total_fights_r"] == 0.0
    assert feat["total_fights_b"] == 0.0
    assert feat["win_pct_r"] == 0.50
    assert feat["win_pct_b"] == 0.50
    assert feat["layoff_days_r"] == 240.0
    assert feat["is_debut_r"] == 1.0
    assert feat["is_debut_b"] == 1.0

    # When both athletes are debutants, all 7 rate differentials must be exactly 0.0
    rate_diffs = ["slpm_diff", "sapm_diff", "str_acc_diff", "str_def_diff", "td_avg_diff", "td_def_diff", "sub_avg_diff"]
    for col in rate_diffs:
        assert feat[col] == 0.0, f"Debutant differential '{col}' should be 0.0, got {feat[col]}"

    assert not any(np.isnan(v) for v in feat.values()), "Features must contain zero NaNs"

def test_ufc_model_artifacts_exist():
    """Verify all 7 required UFC model artifacts exist and are non-empty."""
    artifacts_dir = ML_DIR / "artifacts" / "ufc"
    expected = [
        "ufc_model.joblib",
        "ufc_baseline_model.joblib",
        "ufc_method_model.joblib",
        "ufc_evaluation_metrics.json",
        "ufc_feature_importance.json",
        "ufc_model_metadata.json",
        "ufc_calibration.json"
    ]
    for fname in expected:
        fpath = artifacts_dir / fname
        assert fpath.exists() and fpath.stat().st_size > 0, f"Artifact {fname} must exist"

def test_ufc_prediction_probability_sum_and_range():
    """Verify predict_ufc_bout returns probabilities summing to 100% and valid odds."""
    test_matchups = [
        ("Jon Jones", "Daniel Cormier"),
        ("Conor McGregor", "Dustin Poirier"),
        ("Khabib Nurmagomedov", "Justin Gaethje"),
        ("Max Holloway", "Alexander Volkanovski")
    ]

    for f_a, f_b in test_matchups:
        res = ufc_predict.predict_ufc_bout(f_a, f_b)
        assert res["sport"] == "ufc_mma"
        assert res["model_version"] == "ufc_v1.1"
        p_a = res["probabilities"]["fighter_a"]["probability"]
        p_b = res["probabilities"]["fighter_b"]["probability"]

        assert 0.0 <= p_a <= 1.0, f"P(A) out of range: {p_a}"
        assert 0.0 <= p_b <= 1.0, f"P(B) out of range: {p_b}"
        assert abs((p_a + p_b) - 1.0) < 1e-5, f"Probabilities do not sum to 100%: {p_a + p_b}"

        odds_a = res["probabilities"]["fighter_a"]["fair_decimal_odds"]
        odds_b = res["probabilities"]["fighter_b"]["fair_decimal_odds"]
        assert odds_a >= 1.0 and odds_b >= 1.0, "Decimal odds must be >= 1.0"

        # Tale of the tape presence
        assert "tale_of_the_tape" in res
        assert res["tale_of_the_tape"]["fighter_a"]["name"] == f_a
        assert res["tale_of_the_tape"]["fighter_b"]["name"] == f_b

def test_ufc_identical_fighters_rejected():
    """Verify predicting the same athlete against themselves raises ValueError."""
    with pytest.raises(ValueError, match="cannot be the same athlete"):
        ufc_predict.predict_ufc_bout("Jon Jones", "Jon Jones")

def test_ufc_unknown_fighter_rejected():
    """Verify predicting an unknown athlete raises a clear error message."""
    with pytest.raises(ValueError, match="not found in official UFC database"):
        ufc_predict.predict_ufc_bout("NonExistentFighter999", "Jon Jones")

def test_ufc_corner_swap_symmetry():
    """
    CRITICAL SYMMETRY REGRESSION TEST:
    Verifies that swapping fighter corner assignments produces exact mathematical symmetry:
    P(A beats B) == 1 - P(B beats A), and swapping corners preserves fair win probabilities
    within a strict numerical tolerance (tol < 1e-4).
    """
    matchups = [
        ("Jon Jones", "Daniel Cormier"),
        ("Dustin Poirier", "Conor McGregor"),
        ("Francis Ngannou", "Stipe Miocic"),
    ]
    for fa, fb in matchups:
        res_ab = ufc_predict.predict_ufc_bout(fa, fb, corner_a="Red", corner_b="Blue")
        res_ba = ufc_predict.predict_ufc_bout(fb, fa, corner_a="Red", corner_b="Blue")

        p_a_in_ab = res_ab["probabilities"]["fighter_a"]["probability"]
        p_b_in_ab = res_ab["probabilities"]["fighter_b"]["probability"]
        p_b_in_ba = res_ba["probabilities"]["fighter_a"]["probability"]
        p_a_in_ba = res_ba["probabilities"]["fighter_b"]["probability"]

        # Symmetry assertions
        assert abs(p_a_in_ab - p_a_in_ba) < 1e-4, f"Asymmetry for {fa}: {p_a_in_ab} vs {p_a_in_ba}"
        assert abs(p_b_in_ab - p_b_in_ba) < 1e-4, f"Asymmetry for {fb}: {p_b_in_ab} vs {p_b_in_ba}"
        assert abs((p_a_in_ab + p_b_in_ab) - 1.0) < 1e-5
        assert abs((p_b_in_ba + p_a_in_ba) - 1.0) < 1e-5

        # Method symmetry
        for method in ["Decision", "KO/TKO", "Submission"]:
            m_ab = res_ab["method_probabilities"].get(method, 0.0)
            m_ba = res_ba["method_probabilities"].get(method, 0.0)
            assert abs(m_ab - m_ba) < 1e-3, f"Method probability asymmetry for {method}: {m_ab} vs {m_ba}"

def test_ufc_historical_bout_ufc_254_khabib_vs_gaethje():
    """
    HISTORICAL BENCHMARK TEST (UFC 254):
    Verifies that at the time of UFC 254 (2020-10-24), Khabib Nurmagomedov is correctly predicted
    as the winner over Justin Gaethje with >55% probability, strictly invariant to corner assignment.
    """
    # Khabib as Fighter A (Red), Gaethje as Fighter B (Blue)
    res_k_red = ufc_predict.predict_ufc_bout(
        "Khabib Nurmagomedov", "Justin Gaethje",
        target_date="2020-10-24", is_title_bout=True, corner_a="Red", corner_b="Blue"
    )
    assert res_k_red["predicted_winner"] == "Khabib Nurmagomedov"
    assert res_k_red["probabilities"]["fighter_a"]["probability"] > 0.55

    # Corner swap: Gaethje as Fighter A (Red), Khabib as Fighter B (Blue)
    res_g_red = ufc_predict.predict_ufc_bout(
        "Justin Gaethje", "Khabib Nurmagomedov",
        target_date="2020-10-24", is_title_bout=True, corner_a="Red", corner_b="Blue"
    )
    assert res_g_red["predicted_winner"] == "Khabib Nurmagomedov"
    assert res_g_red["probabilities"]["fighter_b"]["probability"] > 0.55

    # Numerical symmetry on historical date
    assert abs(res_k_red["probabilities"]["fighter_a"]["probability"] - res_g_red["probabilities"]["fighter_b"]["probability"]) < 1e-4

