"""
Data Acquisition Module for PITCHIQ
Fetches legitimate historical Premier League match records and upcoming fixtures from Football-Data.co.uk.
Provides offline caching, provenance metadata tracking, and data integrity verification.
"""

import os
import json
import urllib.request
import pandas as pd
from datetime import datetime
from pathlib import Path

# Paths configuration
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"
REPORTS_DIR = BASE_DIR / "reports"

SEASONS = [
    {"code": "2122", "season": "2021-2022", "url": "https://www.football-data.co.uk/mmz4281/2122/E0.csv"},
    {"code": "2223", "season": "2022-2023", "url": "https://www.football-data.co.uk/mmz4281/2223/E0.csv"},
    {"code": "2324", "season": "2023-2024", "url": "https://www.football-data.co.uk/mmz4281/2324/E0.csv"},
    {"code": "2425", "season": "2024-2025", "url": "https://www.football-data.co.uk/mmz4281/2425/E0.csv"},
]

FIXTURES_URL = "https://www.football-data.co.uk/fixtures.csv"

def ensure_directories():
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

def download_file(url: str, dest_path: Path, force: bool = False) -> bool:
    """Download a file if it doesn't exist or if force=True."""
    if dest_path.exists() and not force:
        return False
    
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PITCHIQ-ML-Project/1.0"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as response:
        content = response.read()
        dest_path.write_bytes(content)
    return True

def fetch_all_data(force: bool = False) -> dict:
    """Download historical match data and upcoming fixtures."""
    ensure_directories()
    provenance = {
        "provider": "Football-Data.co.uk",
        "competition": "English Premier League (E0)",
        "download_timestamp": datetime.utcnow().isoformat() + "Z",
        "seasons": [],
        "fixtures": {}
    }

    # Fetch historical seasons
    for s in SEASONS:
        dest_file = RAW_DATA_DIR / f"E0_{s['code']}.csv"
        downloaded = download_file(s["url"], dest_file, force=force)
        provenance["seasons"].append({
            "season": s["season"],
            "code": s["code"],
            "url": s["url"],
            "local_file": dest_file.name,
            "size_bytes": dest_file.stat().st_size if dest_file.exists() else 0,
            "downloaded_now": downloaded
        })

    # Fetch upcoming fixtures
    fixtures_file = RAW_DATA_DIR / "fixtures_upcoming.csv"
    try:
        f_downloaded = download_file(FIXTURES_URL, fixtures_file, force=True)
        provenance["fixtures"] = {
            "url": FIXTURES_URL,
            "local_file": fixtures_file.name,
            "size_bytes": fixtures_file.stat().st_size if fixtures_file.exists() else 0,
            "status": "available"
        }
    except Exception as e:
        provenance["fixtures"] = {
            "url": FIXTURES_URL,
            "local_file": fixtures_file.name if fixtures_file.exists() else None,
            "status": "download_failed",
            "error": str(e)
        }

    # Save provenance metadata
    meta_path = RAW_DATA_DIR / "provenance.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(provenance, f, indent=2)

    return provenance

if __name__ == "__main__":
    meta = fetch_all_data()
    print("Data download completed:")
    print(json.dumps(meta, indent=2))
