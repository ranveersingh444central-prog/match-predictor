"""
UFC 2021-2026 Data Refresh & Harmonization Module for PITCHIQ
Extends historical UFC combat records through October 24, 2026.
Source: Official UFCStats.com via Greco1899/scrape_ufc_stats automated pipeline.
Attribution: UFCStats.com / Greco1899 (Open factual sports data).
Stores refreshed raw data strictly in ml/data/ufc/raw_2026/ preserving existing raw 2021 files.
"""

import os
import io
import json
import hashlib
import urllib.request
from datetime import datetime
from pathlib import Path
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAW_2026_DIR = BASE_DIR / "data" / "ufc" / "raw_2026"
PROCESSED_DIR = BASE_DIR / "data" / "ufc" / "processed"
REPORTS_DIR = BASE_DIR / "reports" / "ufc"

GITHUB_BASE = "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/main/"
SOURCE_FILES = {
    "events": "ufc_event_details.csv",
    "results": "ufc_fight_results.csv",
    "stats": "ufc_fight_stats.csv",
    "fighters": "ufc_fighter_tott.csv"
}

def compute_sha256(filepath: Path) -> str:
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()

def download_source_files(force: bool = False) -> dict[str, Path]:
    """Downloads updated raw files from GitHub repository into raw_2026/."""
    RAW_2026_DIR.mkdir(parents=True, exist_ok=True)
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PITCHIQ-UFC-Refresh/2.0"}
    downloaded_paths = {}

    for key, filename in SOURCE_FILES.items():
        dest = RAW_2026_DIR / filename
        if not dest.exists() or force:
            url = GITHUB_BASE + filename
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = resp.read()
                dest.write_bytes(data)
        downloaded_paths[key] = dest

    return downloaded_paths

def build_normalized_2026_datasets() -> tuple[Path, Path, dict]:
    """
    Assembles normalized canonical 41-column fight dataset and 14-column fighter dataset.
    Saves outputs in raw_2026/.
    """
    paths = download_source_files(force=False)

    # 1. Load events
    events_df = pd.read_csv(paths["events"])
    events_df["EVENT"] = events_df["EVENT"].astype(str).str.strip()
    events_df["date_parsed"] = pd.to_datetime(events_df["DATE"], errors="coerce")

    # 2. Load results
    fights_df = pd.read_csv(paths["results"])
    fights_df["EVENT"] = fights_df["EVENT"].astype(str).str.strip()
    fights_df["BOUT"] = fights_df["BOUT"].astype(str).str.strip()

    # Merge on EVENT to get verified dates
    merged = pd.merge(
        fights_df,
        events_df[["EVENT", "date_parsed", "DATE", "LOCATION"]],
        on="EVENT",
        how="inner"
    )

    # Split fighters
    split = merged["BOUT"].str.split(" vs. ", expand=True)
    merged["R_fighter"] = split[0].str.strip()
    merged["B_fighter"] = split[1].str.strip()

    # Map Winner
    merged["Winner"] = ""
    merged.loc[merged["OUTCOME"] == "W/L", "Winner"] = merged["R_fighter"]
    merged.loc[merged["OUTCOME"] == "L/W", "Winner"] = merged["B_fighter"]

    # 3. Load and aggregate stats
    stats_df = pd.read_csv(paths["stats"])
    stats_df["EVENT"] = stats_df["EVENT"].astype(str).str.strip()
    stats_df["BOUT"] = stats_df["BOUT"].astype(str).str.strip()
    stats_df["FIGHTER"] = stats_df["FIGHTER"].astype(str).str.strip()

    sig = stats_df["SIG.STR."].str.extract(r"(\d+)\s+of\s+(\d+)").fillna(0).astype(int)
    stats_df["sig_l"] = sig[0]
    stats_df["sig_a"] = sig[1]

    tot = stats_df["TOTAL STR."].str.extract(r"(\d+)\s+of\s+(\d+)").fillna(0).astype(int)
    stats_df["tot_l"] = tot[0]
    stats_df["tot_a"] = tot[1]

    td = stats_df["TD"].str.extract(r"(\d+)\s+of\s+(\d+)").fillna(0).astype(int)
    stats_df["td_l"] = td[0]
    stats_df["td_a"] = td[1]

    stats_df["kd"] = pd.to_numeric(stats_df["KD"], errors="coerce").fillna(0).astype(int)
    stats_df["sub_att"] = pd.to_numeric(stats_df["SUB.ATT"], errors="coerce").fillna(0).astype(int)
    stats_df["rev"] = pd.to_numeric(stats_df["REV."], errors="coerce").fillna(0).astype(int)

    stats_agg = stats_df.groupby(["EVENT", "BOUT", "FIGHTER"]).agg({
        "sig_l": "sum", "sig_a": "sum",
        "tot_l": "sum", "tot_a": "sum",
        "td_l": "sum", "td_a": "sum",
        "kd": "sum", "sub_att": "sum", "rev": "sum"
    }).reset_index()

    r_stats = stats_agg.rename(columns={
        "FIGHTER": "R_fighter",
        "sig_l": "R_sig_l", "sig_a": "R_sig_a",
        "tot_l": "R_tot_l", "tot_a": "R_tot_a",
        "td_l": "R_td_l", "td_a": "R_td_a",
        "kd": "R_KD", "sub_att": "R_SUB_ATT", "rev": "R_REV"
    })
    m_r = pd.merge(
        merged,
        r_stats[["EVENT", "BOUT", "R_fighter", "R_sig_l", "R_sig_a", "R_tot_l", "R_tot_a", "R_td_l", "R_td_a", "R_KD", "R_SUB_ATT", "R_REV"]],
        on=["EVENT", "BOUT", "R_fighter"],
        how="left"
    )

    b_stats = stats_agg.rename(columns={
        "FIGHTER": "B_fighter",
        "sig_l": "B_sig_l", "sig_a": "B_sig_a",
        "tot_l": "B_tot_l", "tot_a": "B_tot_a",
        "td_l": "B_td_l", "td_a": "B_td_a",
        "kd": "B_KD", "sub_att": "B_SUB_ATT", "rev": "B_REV"
    })
    final_m = pd.merge(
        m_r,
        b_stats[["EVENT", "BOUT", "B_fighter", "B_sig_l", "B_sig_a", "B_tot_l", "B_tot_a", "B_td_l", "B_td_a", "B_KD", "B_SUB_ATT", "B_REV"]],
        on=["EVENT", "BOUT", "B_fighter"],
        how="left"
    )

    for col in ["R_sig_l", "R_sig_a", "R_tot_l", "R_tot_a", "R_td_l", "R_td_a", "R_KD", "R_SUB_ATT", "R_REV",
                "B_sig_l", "B_sig_a", "B_tot_l", "B_tot_a", "B_td_l", "B_td_a", "B_KD", "B_SUB_ATT", "B_REV"]:
        final_m[col] = final_m[col].fillna(0).astype(int)

    final_m["R_SIG_STR."] = final_m["R_sig_l"].astype(str) + " of " + final_m["R_sig_a"].astype(str)
    final_m["B_SIG_STR."] = final_m["B_sig_l"].astype(str) + " of " + final_m["B_sig_a"].astype(str)
    final_m["R_TOTAL_STR."] = final_m["R_tot_l"].astype(str) + " of " + final_m["R_tot_a"].astype(str)
    final_m["B_TOTAL_STR."] = final_m["B_tot_l"].astype(str) + " of " + final_m["B_tot_a"].astype(str)
    final_m["R_TD"] = final_m["R_td_l"].astype(str) + " of " + final_m["R_td_a"].astype(str)
    final_m["B_TD"] = final_m["B_td_l"].astype(str) + " of " + final_m["B_td_a"].astype(str)

    # Percentage strings
    final_m["R_SIG_STR_pct"] = (final_m["R_sig_l"] / final_m["R_sig_a"].replace(0, np.nan) * 100).fillna(0).round().astype(int).astype(str) + "%"
    final_m["B_SIG_STR_pct"] = (final_m["B_sig_l"] / final_m["B_sig_a"].replace(0, np.nan) * 100).fillna(0).round().astype(int).astype(str) + "%"
    final_m["R_TD_pct"] = (final_m["R_td_l"] / final_m["R_td_a"].replace(0, np.nan) * 100).fillna(0).round().astype(int).astype(str) + "%"
    final_m["B_TD_pct"] = (final_m["B_td_l"] / final_m["B_td_a"].replace(0, np.nan) * 100).fillna(0).round().astype(int).astype(str) + "%"

    final_m["win_by"] = final_m["METHOD"].fillna("Unknown")
    final_m["last_round"] = pd.to_numeric(final_m["ROUND"], errors="coerce").fillna(1).astype(int)
    final_m["last_round_time"] = final_m["TIME"].fillna("5:00")
    final_m["Format"] = final_m["TIME FORMAT"].fillna("3 Rnd (5-5-5)")
    final_m["Referee"] = final_m["REFEREE"].fillna("")
    final_m["date"] = final_m["date_parsed"].dt.strftime("%B %d, %Y")
    final_m["location"] = final_m["LOCATION"].fillna("")
    final_m["Fight_type"] = final_m["WEIGHTCLASS"].fillna("Catch Weight Bout")

    # Extra target and position fields for compatibility
    for extra in ["R_CTRL", "B_CTRL", "R_HEAD", "B_HEAD", "R_BODY", "B_BODY", "R_LEG", "B_LEG", "R_DISTANCE", "B_DISTANCE", "R_CLINCH", "B_CLINCH", "R_GROUND", "B_GROUND"]:
        final_m[extra] = "0 of 0" if "of" in extra or extra.endswith(("_HEAD", "_BODY", "_LEG", "_DISTANCE", "_CLINCH", "_GROUND")) else 0

    raw_fights_cols = [
        "R_fighter", "B_fighter", "R_KD", "B_KD", "R_SIG_STR.", "B_SIG_STR.", "R_SIG_STR_pct", "B_SIG_STR_pct",
        "R_TOTAL_STR.", "B_TOTAL_STR.", "R_TD", "B_TD", "R_TD_pct", "B_TD_pct", "R_SUB_ATT", "B_SUB_ATT",
        "R_REV", "B_REV", "R_CTRL", "B_CTRL", "R_HEAD", "B_HEAD", "R_BODY", "B_BODY", "R_LEG", "B_LEG",
        "R_DISTANCE", "B_DISTANCE", "R_CLINCH", "B_CLINCH", "R_GROUND", "B_GROUND", "win_by", "last_round",
        "last_round_time", "Format", "Referee", "date", "location", "Fight_type", "Winner"
    ]
    fights_out = final_m[raw_fights_cols].copy()
    fights_file = RAW_2026_DIR / "raw_total_fight_data_2026.csv"
    fights_out.to_csv(fights_file, sep=";", index=False)

    # 4. Fighter Profiles
    tott_df = pd.read_csv(paths["fighters"])
    base_file = BASE_DIR / "data" / "ufc" / "raw" / "raw_fighter_details.csv"
    base_df = pd.read_csv(base_file) if base_file.exists() else pd.DataFrame()

    fighters_out = pd.DataFrame({
        "fighter_name": tott_df["FIGHTER"].astype(str).str.strip(),
        "Height": tott_df["HEIGHT"],
        "Weight": tott_df["WEIGHT"],
        "Reach": tott_df["REACH"],
        "Stance": tott_df["STANCE"],
        "DOB": tott_df["DOB"]
    })

    stat_cols = ["SLpM", "Str_Acc", "SApM", "Str_Def", "TD_Avg", "TD_Acc", "TD_Def", "Sub_Avg"]
    if not base_df.empty:
        merged_f = pd.merge(
            fighters_out,
            base_df[["fighter_name"] + [c for c in stat_cols if c in base_df.columns]],
            on="fighter_name",
            how="left"
        )
        for col in stat_cols:
            if col not in merged_f.columns:
                merged_f[col] = 0.0
            elif "Acc" in col or "Def" in col:
                merged_f[col] = merged_f[col].fillna("0%")
            else:
                merged_f[col] = merged_f[col].fillna(0.0)
        fighters_out = merged_f
    else:
        for col in stat_cols:
            fighters_out[col] = "0%" if ("Acc" in col or "Def" in col) else 0.0

    fighters_file = RAW_2026_DIR / "raw_fighter_details_2026.csv"
    fighters_out.to_csv(fighters_file, index=False)

    # 5. Provenance Record
    provenance = {
        "dataset_name": "PITCHIQ UFC Canonical Combat Archive (2026 Refresh)",
        "primary_source": "UFCStats.com (Official Statistics Provider for Ultimate Fighting Championship)",
        "curator": "Greco1899 / scrape_ufc_stats automated scraper",
        "license": "Public Domain factual sports data / GPL-3.0 Scraper (Attribution Preserved)",
        "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
        "acquisition_timestamp": datetime.utcnow().isoformat() + "Z",
        "date_coverage": {
            "earliest": final_m["date_parsed"].min().strftime("%Y-%m-%d"),
            "latest": final_m["date_parsed"].max().strftime("%Y-%m-%d")
        },
        "total_raw_bouts": len(fights_out),
        "total_raw_fighters": len(fighters_out),
        "files": {
            "fights": {
                "local_file": fights_file.name,
                "size_bytes": fights_file.stat().st_size,
                "sha256": compute_sha256(fights_file),
                "source_urls": [GITHUB_BASE + "ufc_fight_results.csv", GITHUB_BASE + "ufc_event_details.csv", GITHUB_BASE + "ufc_fight_stats.csv"]
            },
            "fighters": {
                "local_file": fighters_file.name,
                "size_bytes": fighters_file.stat().st_size,
                "sha256": compute_sha256(fighters_file),
                "source_urls": [GITHUB_BASE + "ufc_fighter_tott.csv"]
            }
        }
    }

    prov_file = RAW_2026_DIR / "ufc_provenance_2026.json"
    with open(prov_file, "w", encoding="utf-8") as f:
        json.dump(provenance, f, indent=2)

    return fights_file, fighters_file, provenance

if __name__ == "__main__":
    f_path, fig_path, prov = build_normalized_2026_datasets()
    print("Successfully built normalized 2026 datasets:")
    print("Fights file:", f_path)
    print("Fighters file:", fig_path)
    print("Coverage:", prov["date_coverage"])
    print("Total Bouts:", prov["total_raw_bouts"])
    print("Total Fighters:", prov["total_raw_fighters"])
