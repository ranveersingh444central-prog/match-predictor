"""
Data Validation and Cleaning Module for PITCHIQ
Validates raw match records, normalizes dates, handles missing values,
and exports clean datasets with comprehensive data-quality metrics.
"""

import os
import glob
import json
from pathlib import Path
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"
REPORTS_DIR = BASE_DIR / "reports"

REQUIRED_COLUMNS = ["Date", "HomeTeam", "AwayTeam", "FTHG", "FTAG", "FTR"]

def load_and_validate_raw_data() -> tuple[pd.DataFrame, dict]:
    """Reads all raw season CSVs, applies strict validation and cleaning."""
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    csv_files = sorted(glob.glob(str(RAW_DATA_DIR / "E0_*.csv")))
    if not csv_files:
        raise FileNotFoundError(f"No raw match CSVs found in {RAW_DATA_DIR}. Run data_loader.py first.")

    raw_dfs = []
    total_raw_rows = 0

    for fpath in csv_files:
        season_code = Path(fpath).stem.replace("E0_", "")
        try:
            df = pd.read_csv(fpath, encoding="utf-8-sig")
        except Exception:
            df = pd.read_csv(fpath, encoding="latin1")

        total_raw_rows += len(df)
        df["SeasonCode"] = season_code
        raw_dfs.append(df)

    combined = pd.concat(raw_dfs, ignore_index=True)

    # 1. Check required columns
    missing_required_cols = [c for c in REQUIRED_COLUMNS if c not in combined.columns]
    if missing_required_cols:
        raise ValueError(f"Missing essential columns in raw data: {missing_required_cols}")

    # 2. Filter out non-match rows (e.g. empty rows or missing team names)
    valid_mask = combined["HomeTeam"].notna() & combined["AwayTeam"].notna() & combined["Date"].notna()
    df_valid = combined[valid_mask].copy()
    empty_rows_dropped = total_raw_rows - len(df_valid)

    # 3. Clean and parse Date
    # Football-Data dates are usually 'DD/MM/YYYY' or 'DD/MM/YY'
    df_valid["Date"] = pd.to_datetime(df_valid["Date"], dayfirst=True, errors="coerce")
    invalid_dates_count = int(df_valid["Date"].isna().sum())
    df_valid = df_valid[df_valid["Date"].notna()].copy()

    # 4. Score validity
    df_valid["FTHG"] = pd.to_numeric(df_valid["FTHG"], errors="coerce")
    df_valid["FTAG"] = pd.to_numeric(df_valid["FTAG"], errors="coerce")
    valid_scores_mask = (df_valid["FTHG"].notna()) & (df_valid["FTAG"].notna()) & (df_valid["FTHG"] >= 0) & (df_valid["FTAG"] >= 0)
    df_valid = df_valid[valid_scores_mask].copy()
    df_valid["FTHG"] = df_valid["FTHG"].astype(int)
    df_valid["FTAG"] = df_valid["FTAG"].astype(int)

    # 5. Result verification
    # Calculate expected result and cross-check
    def determine_result(row):
        if row["FTHG"] > row["FTAG"]:
            return "H"
        elif row["FTHG"] < row["FTAG"]:
            return "A"
        else:
            return "D"

    expected_results = df_valid.apply(determine_result, axis=1)
    # Ensure FTR matches standard H/D/A
    df_valid["FTR"] = df_valid["FTR"].astype(str).str.strip().str.upper()
    mismatched_results = int((df_valid["FTR"] != expected_results).sum())
    # Correct any typographical mismatch with ground-truth goal score
    df_valid["FTR"] = expected_results

    # 6. Team name cleaning
    df_valid["HomeTeam"] = df_valid["HomeTeam"].astype(str).str.strip()
    df_valid["AwayTeam"] = df_valid["AwayTeam"].astype(str).str.strip()

    # 7. Check for duplicate matches (same date, home team, away team)
    duplicate_count = int(df_valid.duplicated(subset=["Date", "HomeTeam", "AwayTeam"]).sum())
    df_valid = df_valid.drop_duplicates(subset=["Date", "HomeTeam", "AwayTeam"]).copy()

    # 8. Sort chronologically
    df_valid = df_valid.sort_values(by=["Date", "HomeTeam"]).reset_index(drop=True)

    # Calculate match stats summary if columns exist
    stat_cols = ["HS", "AS", "HST", "AST", "HC", "AC", "HF", "AF", "HY", "AY", "HR", "AR"]
    for sc in stat_cols:
        if sc in df_valid.columns:
            df_valid[sc] = pd.to_numeric(df_valid[sc], errors="coerce").fillna(0).astype(int)

    # Keep relevant columns cleanly
    selected_cols = ["SeasonCode", "Date", "HomeTeam", "AwayTeam", "FTHG", "FTAG", "FTR"]
    for sc in stat_cols:
        if sc in df_valid.columns:
            selected_cols.append(sc)
    
    clean_df = df_valid[selected_cols].copy()

    # Save cleaned dataset
    clean_output_path = PROCESSED_DATA_DIR / "matches_clean.csv"
    clean_df.to_csv(clean_output_path, index=False)

    # Compute quality report
    unique_teams = sorted(list(set(clean_df["HomeTeam"].unique()) | set(clean_df["AwayTeam"].unique())))
    result_counts = clean_df["FTR"].value_counts().to_dict()
    total_valid = len(clean_df)

    quality_report = {
        "dataset_name": "Football-Data.co.uk Premier League Master Records",
        "competition": "English Premier League",
        "total_raw_rows_examined": total_raw_rows,
        "valid_matches_retained": total_valid,
        "dropped_empty_or_header_rows": empty_rows_dropped,
        "invalid_dates_dropped": invalid_dates_count,
        "duplicates_removed": duplicate_count,
        "result_mismatches_resolved": mismatched_results,
        "date_range_start": clean_df["Date"].min().strftime("%Y-%m-%d"),
        "date_range_end": clean_df["Date"].max().strftime("%Y-%m-%d"),
        "total_teams": len(unique_teams),
        "teams": unique_teams,
        "outcome_distribution": {
            "Home Win (H)": {"count": int(result_counts.get("H", 0)), "pct": round(result_counts.get("H", 0) / total_valid * 100, 2)},
            "Draw (D)": {"count": int(result_counts.get("D", 0)), "pct": round(result_counts.get("D", 0) / total_valid * 100, 2)},
            "Away Win (A)": {"count": int(result_counts.get("A", 0)), "pct": round(result_counts.get("A", 0) / total_valid * 100, 2)},
        },
        "seasons_covered": sorted(clean_df["SeasonCode"].unique().tolist()),
        "average_goals_per_match": round(float((clean_df["FTHG"] + clean_df["FTAG"]).mean()), 3),
        "home_goals_avg": round(float(clean_df["FTHG"].mean()), 3),
        "away_goals_avg": round(float(clean_df["FTAG"].mean()), 3),
    }

    report_path = REPORTS_DIR / "data_quality_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(quality_report, f, indent=2)

    return clean_df, quality_report

if __name__ == "__main__":
    df, report = load_and_validate_raw_data()
    print("Clean matches count:", len(df))
    print("Report summary:")
    print(json.dumps(report, indent=2))
