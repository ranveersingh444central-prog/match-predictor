"""
Data and Analytics Service for PITCHIQ
Handles match filtering, pagination, team record breakdowns,
home/away splits, and data summary ingestion.
"""

import json
from pathlib import Path
from typing import Optional
import pandas as pd
import numpy as np

from app.core.config import settings

class DataService:
    def __init__(self):
        self._matches_df: Optional[pd.DataFrame] = None
        self._quality_report: Optional[dict] = None

    def _load_data(self):
        clean_path = settings.processed_data_dir / "matches_clean.csv"
        if not clean_path.exists():
            return None
        if self._matches_df is None:
            df = pd.read_csv(clean_path)
            df["Date"] = pd.to_datetime(df["Date"])
            self._matches_df = df
        return self._matches_df

    def get_summary(self) -> dict:
        report_path = settings.reports_dir / "data_quality_report.json"
        if report_path.exists():
            with open(report_path, "r", encoding="utf-8") as f:
                rep = json.load(f)
                rep["total_valid_matches"] = rep.get("valid_matches_retained", rep.get("total_valid_matches", 0))
                return rep
        df = self._load_data()
        if df is None:
            return {"error": "Data not initialized"}
        return {
            "dataset_name": "Football-Data.co.uk Premier League",
            "competition": "English Premier League",
            "total_valid_matches": len(df),
            "valid_matches_retained": len(df),
            "date_range_start": df["Date"].min().strftime("%Y-%m-%d"),
            "date_range_end": df["Date"].max().strftime("%Y-%m-%d"),
            "total_teams": len(set(df["HomeTeam"].unique()) | set(df["AwayTeam"].unique())),
            "outcome_distribution": df["FTR"].value_counts().to_dict(),
            "seasons_covered": sorted(df["SeasonCode"].unique().tolist())
        }

    def get_teams(self) -> list[dict]:
        df = self._load_data()
        if df is None:
            return []

        teams = sorted(list(set(df["HomeTeam"].unique()) | set(df["AwayTeam"].unique())))
        team_stats = []

        for t in teams:
            home_matches = df[df["HomeTeam"] == t]
            away_matches = df[df["AwayTeam"] == t]
            total_matches = len(home_matches) + len(away_matches)

            h_wins = (home_matches["FTR"] == "H").sum()
            h_draws = (home_matches["FTR"] == "D").sum()
            h_losses = (home_matches["FTR"] == "A").sum()

            a_wins = (away_matches["FTR"] == "A").sum()
            a_draws = (away_matches["FTR"] == "D").sum()
            a_losses = (away_matches["FTR"] == "H").sum()

            wins = int(h_wins + a_wins)
            draws = int(h_draws + a_draws)
            losses = int(h_losses + a_losses)
            points = wins * 3 + draws

            gf = int(home_matches["FTHG"].sum() + away_matches["FTAG"].sum())
            ga = int(home_matches["FTAG"].sum() + away_matches["FTHG"].sum())
            gd = gf - ga

            ppg = round(points / total_matches, 2) if total_matches > 0 else 0.0
            win_rate = round((wins / total_matches) * 100, 1) if total_matches > 0 else 0.0

            team_stats.append({
                "name": t,
                "matches_played": total_matches,
                "wins": wins,
                "draws": draws,
                "losses": losses,
                "points": points,
                "goals_for": gf,
                "goals_against": ga,
                "goal_diff": gd,
                "ppg": ppg,
                "win_rate": win_rate
            })

        # Sort by points descending, then GD descending
        team_stats.sort(key=lambda x: (x["points"], x["goal_diff"]), reverse=True)
        return team_stats

    def get_team_analysis(self, team_name: str) -> Optional[dict]:
        df = self._load_data()
        if df is None:
            return None

        # Case-insensitive matching
        matched_team = None
        for t in set(df["HomeTeam"].unique()) | set(df["AwayTeam"].unique()):
            if t.lower() == team_name.lower():
                matched_team = t
                break

        if not matched_team:
            return None

        team_matches = df[(df["HomeTeam"] == matched_team) | (df["AwayTeam"] == matched_team)].copy()
        team_matches = team_matches.sort_values(by="Date", ascending=True)

        home_m = team_matches[team_matches["HomeTeam"] == matched_team]
        away_m = team_matches[team_matches["AwayTeam"] == matched_team]

        h_w = int((home_m["FTR"] == "H").sum())
        h_d = int((home_m["FTR"] == "D").sum())
        h_l = int((home_m["FTR"] == "A").sum())
        h_gf = int(home_m["FTHG"].sum())
        h_ga = int(home_m["FTAG"].sum())

        a_w = int((away_m["FTR"] == "A").sum())
        a_d = int((away_m["FTR"] == "D").sum())
        a_l = int((away_m["FTR"] == "H").sum())
        a_gf = int(away_m["FTAG"].sum())
        a_ga = int(away_m["FTHG"].sum())

        total_m = len(team_matches)
        wins = h_w + a_w
        draws = h_d + a_d
        losses = h_l + a_l
        points = wins * 3 + draws
        gf = h_gf + a_gf
        ga = h_ga + a_ga

        # Recent matches history list
        recent_list = []
        for _, row in team_matches.tail(15).iterrows():
            is_home = (row["HomeTeam"] == matched_team)
            opp = row["AwayTeam"] if is_home else row["HomeTeam"]
            t_goals = int(row["FTHG"] if is_home else row["FTAG"])
            o_goals = int(row["FTAG"] if is_home else row["FTHG"])
            if t_goals > o_goals:
                res = "W"
            elif t_goals == o_goals:
                res = "D"
            else:
                res = "L"

            recent_list.append({
                "date": row["Date"].strftime("%Y-%m-%d"),
                "opponent": opp,
                "is_home": is_home,
                "venue": "Home" if is_home else "Away",
                "team_goals": t_goals,
                "opp_goals": o_goals,
                "score": f"{t_goals} - {o_goals}",
                "result": res,
                "season": row["SeasonCode"]
            })

        form_wld = [m["result"] for m in recent_list[-5:]]

        return {
            "name": matched_team,
            "matches_played": total_m,
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "goals_for": gf,
            "goals_against": ga,
            "goal_diff": gf - ga,
            "points": points,
            "ppg": round(points / total_m, 2) if total_m > 0 else 0.0,
            "win_rate": round(wins / total_m * 100, 1) if total_m > 0 else 0.0,
            "avg_goals_scored": round(gf / total_m, 2) if total_m > 0 else 0.0,
            "avg_goals_conceded": round(ga / total_m, 2) if total_m > 0 else 0.0,
            "home_record": {
                "matches": len(home_m),
                "wins": h_w,
                "draws": h_d,
                "losses": h_l,
                "goals_for": h_gf,
                "goals_against": h_ga,
                "win_rate": round(h_w / len(home_m) * 100, 1) if len(home_m) > 0 else 0.0,
                "ppg": round((h_w * 3 + h_d) / len(home_m), 2) if len(home_m) > 0 else 0.0
            },
            "away_record": {
                "matches": len(away_m),
                "wins": a_w,
                "draws": a_d,
                "losses": a_l,
                "goals_for": a_gf,
                "goals_against": a_ga,
                "win_rate": round(a_w / len(away_m) * 100, 1) if len(away_m) > 0 else 0.0,
                "ppg": round((a_w * 3 + a_d) / len(away_m), 2) if len(away_m) > 0 else 0.0
            },
            "recent_form": form_wld,
            "recent_matches": recent_list[::-1]  # most recent first
        }

    def get_matches(
        self,
        team: Optional[str] = None,
        season: Optional[str] = None,
        result: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> dict:
        df = self._load_data()
        if df is None:
            return {"total": 0, "page": page, "page_size": page_size, "matches": []}

        filtered = df.copy()

        if team:
            t_clean = team.strip()
            filtered = filtered[(filtered["HomeTeam"].str.lower() == t_clean.lower()) | (filtered["AwayTeam"].str.lower() == t_clean.lower())]

        if season:
            s_clean = season.strip()
            filtered = filtered[filtered["SeasonCode"] == s_clean]

        if result:
            r_clean = result.strip().upper()
            filtered = filtered[filtered["FTR"] == r_clean]

        # Sort reverse chronologically (most recent first)
        filtered = filtered.sort_values(by="Date", ascending=False)
        total = len(filtered)

        start = (page - 1) * page_size
        end = start + page_size
        paged_df = filtered.iloc[start:end]

        matches = []
        for _, row in paged_df.iterrows():
            matches.append({
                "date": row["Date"].strftime("%Y-%m-%d"),
                "season": row["SeasonCode"],
                "home_team": row["HomeTeam"],
                "away_team": row["AwayTeam"],
                "home_goals": int(row["FTHG"]),
                "away_goals": int(row["FTAG"]),
                "result": row["FTR"],
                "score": f"{int(row['FTHG'])} - {int(row['FTAG'])}",
                "shots": f"{int(row.get('HS', 0))} - {int(row.get('AS', 0))}",
                "shots_target": f"{int(row.get('HST', 0))} - {int(row.get('AST', 0))}"
            })

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": int(np.ceil(total / page_size)) if total > 0 else 1,
            "matches": matches
        }

data_service = DataService()
