"""
Upcoming Fixtures and Data Refresh Service for PITCHIQ
Parses scheduled upcoming Premier League fixtures from Football-Data.co.uk.
Provides reproducible fixtures ingestion, fixture validation, and status tracking.
"""

import os
import json
import csv
import urllib.request
from pathlib import Path
from datetime import datetime
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"
FIXTURES_CACHE_FILE = PROCESSED_DATA_DIR / "upcoming_fixtures.json"

FIXTURES_URL = "https://www.football-data.co.uk/fixtures.csv"

def fetch_and_parse_upcoming_fixtures(force_refresh: bool = False) -> list[dict]:
    """
    Downloads and extracts upcoming English Premier League (Div E0) matches.
    If network is unavailable, falls back gracefully to cached fixtures.
    """
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    raw_fixtures_path = RAW_DATA_DIR / "fixtures_upcoming.csv"

    if force_refresh or not raw_fixtures_path.exists():
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PITCHIQ/1.0"}
            req = urllib.request.Request(FIXTURES_URL, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as response:
                raw_fixtures_path.write_bytes(response.read())
        except Exception as e:
            # If download fails, check if we have a cached version
            if FIXTURES_CACHE_FILE.exists():
                with open(FIXTURES_CACHE_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            return []

    fixtures = []
    if not raw_fixtures_path.exists():
        return []

    try:
        with open(raw_fixtures_path, "r", encoding="utf-8-sig", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("Div") == "E0":
                    raw_date = row.get("Date", "").strip()
                    raw_time = row.get("Time", "").strip() or "15:00"
                    home_team = row.get("HomeTeam", "").strip()
                    away_team = row.get("AwayTeam", "").strip()

                    if not home_team or not away_team:
                        continue

                    # Parse date safely (DD/MM/YYYY)
                    iso_date = raw_date
                    try:
                        parsed_dt = datetime.strptime(raw_date, "%d/%m/%Y")
                        iso_date = parsed_dt.strftime("%Y-%m-%d")
                    except Exception:
                        pass

                    fid = f"e0_{iso_date.replace('-', '')}_{home_team.lower().replace(' ', '_')}_{away_team.lower().replace(' ', '_')}"
                    
                    fixtures.append({
                        "fixture_id": fid,
                        "competition": "English Premier League",
                        "division": "E0",
                        "date": iso_date,
                        "time": raw_time,
                        "home_team": home_team,
                        "away_team": away_team,
                        "status": "scheduled",
                        "odds_context": {
                            "b365_h": row.get("B365H"),
                            "b365_d": row.get("B365D"),
                            "b365_a": row.get("B365A"),
                        } if row.get("B365H") else None
                    })
    except Exception as e:
        print(f"Error parsing upcoming fixtures: {e}")

    # Cache processed fixtures
    with open(FIXTURES_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(fixtures, f, indent=2)

    return fixtures

def get_upcoming_fixtures() -> dict:
    """Returns list of fixtures with metadata."""
    fixtures = fetch_and_parse_upcoming_fixtures(force_refresh=False)
    cache_time = None
    if FIXTURES_CACHE_FILE.exists():
        cache_time = datetime.fromtimestamp(FIXTURES_CACHE_FILE.stat().st_mtime).isoformat() + "Z"

    return {
        "count": len(fixtures),
        "source": "Football-Data.co.uk Fixtures Feed",
        "last_updated": cache_time or datetime.utcnow().isoformat() + "Z",
        "competition": "English Premier League",
        "fixtures": fixtures
    }

if __name__ == "__main__":
    res = get_upcoming_fixtures()
    print(f"Fetched {res['count']} upcoming fixtures:")
    for fx in res["fixtures"][:5]:
        print(f" - {fx['date']} {fx['time']} | {fx['home_team']} vs {fx['away_team']}")
