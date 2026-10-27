"""
UFC Data Validation, Cleaning, and Quality Reporting Module for PITCHIQ
Validates raw bout records and fighter biographical profiles.
Handles missing values, parses physical units (height, reach, weight),
resolves duplicate bouts, maps binary and method targets, and exports clean datasets.
"""

import re
import json
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UFC_RAW_DIR = BASE_DIR / "data" / "ufc" / "raw"
UFC_PROCESSED_DIR = BASE_DIR / "data" / "ufc" / "processed"
UFC_REPORTS_DIR = BASE_DIR / "reports" / "ufc"

# Standard UFC weight classes
CANONICAL_DIVISIONS = [
    "Heavyweight",
    "Light Heavyweight",
    "Middleweight",
    "Welterweight",
    "Lightweight",
    "Featherweight",
    "Bantamweight",
    "Flyweight",
    "Women's Strawweight",
    "Women's Flyweight",
    "Women's Bantamweight",
    "Women's Featherweight",
    "Catch Weight",
    "Open Weight"
]

def parse_height_inches(h_str) -> float:
    """Parses height string like 5' 11\" into total inches."""
    if pd.isna(h_str):
        return np.nan
    h_str = str(h_str).strip()
    m = re.match(r"^(\d+)'\s*(\d+)?\"?$", h_str)
    if m:
        feet = int(m.group(1))
        inches = int(m.group(2)) if m.group(2) else 0
        return float(feet * 12 + inches)
    return np.nan

def parse_reach_inches(r_str) -> float:
    """Parses reach string like 76\" or 76.0 into float inches."""
    if pd.isna(r_str):
        return np.nan
    r_str = str(r_str).replace('"', '').strip()
    try:
        val = float(r_str)
        return val if val > 0 else np.nan
    except (ValueError, TypeError):
        return np.nan

def parse_weight_lbs(w_str) -> float:
    """Parses weight string like 185 lbs. into float pounds."""
    if pd.isna(w_str):
        return np.nan
    w_str = str(w_str).replace("lbs.", "").replace("lbs", "").strip()
    try:
        val = float(w_str)
        return val if val > 0 else np.nan
    except (ValueError, TypeError):
        return np.nan

def parse_percentage(pct_str) -> float:
    """Converts percentage string like '45%' or '0.45' into decimal float [0.0, 1.0]."""
    if pd.isna(pct_str):
        return 0.0
    pct_str = str(pct_str).replace("%", "").strip()
    try:
        val = float(pct_str)
        return val / 100.0 if val > 1.0 else val
    except (ValueError, TypeError):
        return 0.0

def parse_stat_ratio(ratio_str) -> tuple[float, float]:
    """Parses string formatted as 'X of Y' into (landed, attempted)."""
    if pd.isna(ratio_str):
        return (0.0, 0.0)
    parts = str(ratio_str).lower().split(" of ")
    if len(parts) == 2:
        try:
            return (float(parts[0].strip()), float(parts[1].strip()))
        except (ValueError, TypeError):
            return (0.0, 0.0)
    return (0.0, 0.0)

def extract_weight_class(fight_type_str: str) -> tuple[str, bool]:
    """
    Extracts canonical weight division and title bout indicator from Fight_type string.
    Example: 'UFC Light Heavyweight Title Bout' -> ('Light Heavyweight', True)
    """
    if pd.isna(fight_type_str):
        return ("Catch Weight", False)
    
    raw = str(fight_type_str).strip()
    is_title = "Title" in raw or "Championship" in raw

    cleaned = raw.replace("UFC", "").replace("Title", "").replace("Bout", "").strip()
    
    # Match against canonical divisions
    for division in CANONICAL_DIVISIONS:
        # Check standard casing and variations
        div_no_punct = division.lower().replace("'", "").replace(" ", "")
        check_str = cleaned.lower().replace("'", "").replace(" ", "")
        if div_no_punct in check_str:
            return (division, is_title)
        
    if "women" in cleaned.lower() and "strawweight" in cleaned.lower():
        return ("Women's Strawweight", is_title)
    if "women" in cleaned.lower() and "flyweight" in cleaned.lower():
        return ("Women's Flyweight", is_title)
    if "women" in cleaned.lower() and "bantamweight" in cleaned.lower():
        return ("Women's Bantamweight", is_title)
    if "women" in cleaned.lower() and "featherweight" in cleaned.lower():
        return ("Women's Featherweight", is_title)
    if "open" in cleaned.lower():
        return ("Open Weight", is_title)
    
    return ("Catch Weight", is_title)

def normalize_method(win_by_str: str) -> str:
    """Normalizes win_by into standardized method category: KO/TKO, Submission, Decision, Other."""
    if pd.isna(win_by_str):
        return "Unknown"
    val = str(win_by_str).strip().lower()
    if "ko" in val or "tko" in val or "doctor" in val:
        return "KO/TKO"
    elif "sub" in val:
        return "Submission"
    elif "dec" in val:
        return "Decision"
    else:
        return "Other"

UFC_RAW_2026_DIR = BASE_DIR / "data" / "ufc" / "raw_2026"

def clean_fighter_profiles(custom_raw_path: str | Path | None = None) -> tuple[pd.DataFrame, dict]:
    """Cleans and validates raw fighter biographical details."""
    if custom_raw_path:
        raw_file = Path(custom_raw_path)
    elif (UFC_RAW_2026_DIR / "raw_fighter_details_2026.csv").exists():
        raw_file = UFC_RAW_2026_DIR / "raw_fighter_details_2026.csv"
    else:
        raw_file = UFC_RAW_DIR / "raw_fighter_details.csv"

    if not raw_file.exists():
        raise FileNotFoundError(f"Missing {raw_file}. Run ufc_data_loader.py or ufc_data_refresh.py first.")

    df = pd.read_csv(raw_file)
    total_raw = len(df)

    # Clean name
    df["fighter_name"] = df["fighter_name"].astype(str).str.strip()
    df = df[df["fighter_name"].str.len() > 1].copy()

    # Parse physical metrics
    df["height_in"] = df["Height"].apply(parse_height_inches)
    df["height_cm"] = (df["height_in"] * 2.54).round(1)
    df["reach_in"] = df["Reach"].apply(parse_reach_inches)
    df["reach_cm"] = (df["reach_in"] * 2.54).round(1)
    df["weight_lbs"] = df["Weight"].apply(parse_weight_lbs)

    # Standardize stance
    df["stance"] = df["Stance"].astype(str).str.strip()
    df.loc[df["stance"].isin(["nan", "", "None"]), "stance"] = np.nan
    valid_stances = ["Orthodox", "Southpaw", "Switch", "Open Stance", "Sideways"]
    df.loc[~df["stance"].isin(valid_stances) & df["stance"].notna(), "stance"] = "Other"

    # Parse DOB
    df["dob"] = pd.to_datetime(df["DOB"], format="%b %d, %Y", errors="coerce")

    # Numeric career baseline rates
    numeric_cols = ["SLpM", "SApM", "TD_Avg", "Sub_Avg"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    pct_cols = ["Str_Acc", "Str_Def", "TD_Acc", "TD_Def"]
    for col in pct_cols:
        df[col] = df[col].apply(parse_percentage)

    # Deduplicate: if duplicate names exist, keep row with fewest NaNs
    df["null_count"] = df.isna().sum(axis=1)
    df = df.sort_values(by=["fighter_name", "null_count"]).drop_duplicates(subset=["fighter_name"], keep="first")
    df = df.drop(columns=["null_count"]).reset_index(drop=True)

    # Save clean dataset
    clean_path = UFC_PROCESSED_DIR / "fighters_clean.csv"
    df.to_csv(clean_path, index=False)

    report = {
        "total_raw_fighters": total_raw,
        "clean_fighters_retained": len(df),
        "height_coverage_pct": round(float((df['height_in'].notna().mean()) * 100), 2),
        "reach_coverage_pct": round(float((df['reach_in'].notna().mean()) * 100), 2),
        "dob_coverage_pct": round(float((df['dob'].notna().mean()) * 100), 2),
        "stance_distribution": df['stance'].value_counts(dropna=False).to_dict()
    }

    return df, report

def clean_fight_records(fighters_df: pd.DataFrame, custom_raw_path: str | Path | None = None) -> tuple[pd.DataFrame, dict]:
    """Cleans and validates historical UFC bout records."""
    if custom_raw_path:
        raw_file = Path(custom_raw_path)
    elif (UFC_RAW_2026_DIR / "raw_total_fight_data_2026.csv").exists():
        raw_file = UFC_RAW_2026_DIR / "raw_total_fight_data_2026.csv"
    else:
        raw_file = UFC_RAW_DIR / "raw_total_fight_data.csv"

    if not raw_file.exists():
        raise FileNotFoundError(f"Missing {raw_file}. Run ufc_data_loader.py or ufc_data_refresh.py first.")

    df = pd.read_csv(raw_file, sep=";")
    total_raw_bouts = len(df)

    # Clean fighter names
    df["R_fighter"] = df["R_fighter"].astype(str).str.strip()
    df["B_fighter"] = df["B_fighter"].astype(str).str.strip()

    # Drop invalid rows where fighter names are identical or missing
    df = df[(df["R_fighter"].str.len() > 1) & (df["B_fighter"].str.len() > 1)].copy()
    df = df[df["R_fighter"] != df["B_fighter"]].copy()

    # Parse and validate dates strictly
    df["date"] = pd.to_datetime(df["date"], format="%B %d, %Y", errors="coerce")
    df = df[df["date"].notna()].copy()

    # Map Winner to explicit target
    df["Winner"] = df["Winner"].astype(str).str.strip()
    df["result_target"] = "Draw/NC"
    df.loc[df["Winner"] == df["R_fighter"], "result_target"] = "Red"
    df.loc[df["Winner"] == df["B_fighter"], "result_target"] = "Blue"

    # Binary label: 1 if Red win, 0 if Blue win, -1 if Draw/No Contest
    df["winner_code"] = -1
    df.loc[df["result_target"] == "Red", "winner_code"] = 1
    df.loc[df["result_target"] == "Blue", "winner_code"] = 0

    # Parse weight class and title bout
    weight_info = df["Fight_type"].apply(extract_weight_class)
    df["weight_class"] = [wi[0] for wi in weight_info]
    df["title_bout"] = [wi[1] for wi in weight_info]

    # Normalize method of victory
    df["method_clean"] = df["win_by"].apply(normalize_method)

    # Deduplicate: if same date, R_fighter, and B_fighter exist, keep decisive bout
    df["is_decisive"] = df["result_target"].isin(["Red", "Blue"]).astype(int)
    df = df.sort_values(by=["date", "R_fighter", "is_decisive"], ascending=[True, True, False])
    duplicates_count = int(df.duplicated(subset=["date", "R_fighter", "B_fighter"]).sum())
    df = df.drop_duplicates(subset=["date", "R_fighter", "B_fighter"], keep="first")
    df = df.drop(columns=["is_decisive"]).reset_index(drop=True)

    # Sort strictly chronologically
    df = df.sort_values(by=["date", "R_fighter"]).reset_index(drop=True)

    # Save clean dataset
    clean_path = UFC_PROCESSED_DIR / "fights_clean.csv"
    df.to_csv(clean_path, index=False)

    # Check participant coverage with fighter details
    all_participants = set(df["R_fighter"].unique()).union(set(df["B_fighter"].unique()))
    profile_names = set(fighters_df["fighter_name"].unique())
    overlap = all_participants.intersection(profile_names)

    decisive_bouts = df[df["result_target"].isin(["Red", "Blue"])]
    red_wins = int((decisive_bouts["result_target"] == "Red").sum())
    blue_wins = int((decisive_bouts["result_target"] == "Blue").sum())

    report = {
        "total_raw_bouts": total_raw_bouts,
        "clean_bouts_retained": len(df),
        "duplicates_removed": duplicates_count,
        "date_range": {
            "earliest": df["date"].min().strftime("%Y-%m-%d"),
            "latest": df["date"].max().strftime("%Y-%m-%d")
        },
        "decisive_bouts_for_modeling": len(decisive_bouts),
        "draw_no_contest_bouts": int((df["result_target"] == "Draw/NC").sum()),
        "class_distribution": {
            "red_wins": red_wins,
            "blue_wins": blue_wins,
            "red_win_rate_pct": round(red_wins / len(decisive_bouts) * 100, 2),
            "blue_win_rate_pct": round(blue_wins / len(decisive_bouts) * 100, 2)
        },
        "method_distribution": df["method_clean"].value_counts().to_dict(),
        "weight_class_distribution": df["weight_class"].value_counts().to_dict(),
        "participant_coverage": {
            "unique_bout_athletes": len(all_participants),
            "profile_athletes": len(profile_names),
            "matched_athletes": len(overlap),
            "coverage_pct": round(len(overlap) / len(all_participants) * 100, 2)
        }
    }

    return df, report

def run_validation_pipeline() -> dict:
    """Runs end-to-end data validation and writes quality report."""
    UFC_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    UFC_REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    fighters_df, fighters_report = clean_fighter_profiles()
    fights_df, fights_report = clean_fight_records(fighters_df)

    full_report = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "fighters_summary": fighters_report,
        "bouts_summary": fights_report
    }

    report_path = UFC_REPORTS_DIR / "ufc_data_quality_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(full_report, f, indent=2)

    return full_report

if __name__ == "__main__":
    report = run_validation_pipeline()
    print("Validation pipeline finished successfully:")
    print(json.dumps(report, indent=2))
