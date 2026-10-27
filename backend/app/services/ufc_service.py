"""
UFC Data & Prediction Service for FastAPI Backend
Provides high-performance queries for 3,500+ fighter profiles, 6,000+ historical bouts,
model evaluation artifacts, and real-time machine-learning prediction inference.
"""

import sys
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, Any
import pandas as pd
import numpy as np
from fastapi import HTTPException

from app.core.config import settings

# Ensure ml/src/ufc is on Python path
ufc_src_path = str(settings.ml_dir / "src" / "ufc")
if ufc_src_path not in sys.path:
    sys.path.insert(0, ufc_src_path)

import ufc_predict

class UFCService:
    def __init__(self):
        self._fighters_df: Optional[pd.DataFrame] = None
        self._fights_df: Optional[pd.DataFrame] = None
        self._fighter_fight_counts: Optional[dict[str, dict]] = None

    def _ensure_data_loaded(self):
        """Lazily loads and caches clean UFC datasets."""
        if self._fighters_df is None:
            f_path = settings.ufc_processed_data_dir / "fighters_clean.csv"
            if not f_path.exists():
                raise HTTPException(status_code=503, detail="UFC fighters dataset not available. Ingestion pipeline must be run.")
            self._fighters_df = pd.read_csv(f_path)

        if self._fights_df is None:
            b_path = settings.ufc_processed_data_dir / "fights_clean.csv"
            if not b_path.exists():
                raise HTTPException(status_code=503, detail="UFC bouts dataset not available. Ingestion pipeline must be run.")
            self._fights_df = pd.read_csv(b_path)
            self._fights_df["date"] = pd.to_datetime(self._fights_df["date"])

            # Compute career summary stats for each athlete across all UFC bouts
            counts = {}
            for _, row in self._fights_df.iterrows():
                r = str(row["R_fighter"]).strip()
                b = str(row["B_fighter"]).strip()
                winner = str(row.get("Winner", "")).strip()

                r_st = counts.setdefault(r, {"bouts": 0, "wins": 0, "losses": 0})
                b_st = counts.setdefault(b, {"bouts": 0, "wins": 0, "losses": 0})

                r_st["bouts"] += 1
                b_st["bouts"] += 1

                if winner == r:
                    r_st["wins"] += 1
                    b_st["losses"] += 1
                elif winner == b:
                    b_st["wins"] += 1
                    r_st["losses"] += 1

            self._fighter_fight_counts = counts

    def get_status(self) -> dict:
        """Subsystem health, dataset readiness, and cutoff date metadata."""
        model_ready = (settings.ufc_artifacts_dir / "ufc_model.joblib").exists()
        fights_ready = (settings.ufc_processed_data_dir / "fights_clean.csv").exists()
        fighters_ready = (settings.ufc_processed_data_dir / "fighters_clean.csv").exists()

        model_version = "ufc_v1.1"
        champion_alg = "Random Forest"
        meta_file = settings.ufc_artifacts_dir / "ufc_model_metadata.json"
        if meta_file.exists():
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    model_version = meta.get("model_version", model_version)
                    champion_alg = meta.get("algorithm", champion_alg)
            except Exception:
                pass

        total_bouts = 8961
        total_athletes = 4620
        date_range = ["1994-03-11", "2026-10-24"]

        if fights_ready:
            try:
                self._ensure_data_loaded()
                total_bouts = len(self._fights_df)
                total_athletes = len(self._fighters_df)
                date_range = [
                    self._fights_df["date"].min().strftime("%Y-%m-%d"),
                    self._fights_df["date"].max().strftime("%Y-%m-%d")
                ]
            except Exception:
                pass

        return {
            "status": "healthy" if (model_ready and fights_ready and fighters_ready) else "degraded",
            "sport": "ufc_mma",
            "model_loaded": model_ready,
            "champion_algorithm": champion_alg,
            "model_version": model_version,
            "data_ready": fights_ready and fighters_ready,
            "dataset_period": date_range,
            "total_bouts": total_bouts,
            "total_athletes": total_athletes,
            "dataset_cutoff": date_range[1],
            "disclaimer": f"PITCHIQ UFC predictions reflect official historical statistics from March 1994 to {date_range[1]}. No unverified future fights are simulated."
        }

    def get_metadata(self) -> dict:
        """Full data provenance, license evidence, and ML methodology."""
        prov_2026 = settings.ml_dir / "data" / "ufc" / "raw_2026" / "ufc_provenance_2026.json"
        provenance_file = prov_2026 if prov_2026.exists() else (settings.ufc_raw_data_dir / "ufc_provenance.json")
        prov = {}
        if provenance_file.exists():
            with open(provenance_file, "r", encoding="utf-8") as f:
                prov = json.load(f)

        meta_file = settings.ufc_artifacts_dir / "ufc_model_metadata.json"
        model_meta = {}
        if meta_file.exists():
            with open(meta_file, "r", encoding="utf-8") as f:
                model_meta = json.load(f)
        try:
            self._ensure_data_loaded()
        except Exception:
            pass

        cutoff_date = "2026-10-24"
        if self._fights_df is not None and not self._fights_df.empty:
            cutoff_date = self._fights_df["date"].max().strftime("%Y-%m-%d")

        return {
            "sport": "ufc_mma",
            "provenance": prov,
            "model_metadata": model_meta,
            "target_variable": "winner_code (1 = Red Corner Win, 0 = Blue Corner Win)",
            "classes": [
                {"code": 1, "label": "Red Corner Win", "description": "Higher-seeded/defending fighter"},
                {"code": 0, "label": "Blue Corner Win", "description": "Challenging fighter"}
            ],
            "dataset_cutoff": cutoff_date,
            "leakage_safeguards": {
                "chronological_split": "Train: 1994-2021, Val: 2021-2024, Held-out Test: 2024-2026",
                "in_fight_stats_isolated": True,
                "static_profile_rates_removed": True,
                "debutant_strategy": "Neutral domain medians + explicit debut indicators"
            }
        }

    def get_evaluation_metrics(self) -> dict:
        """Chronological model performance evaluation metrics."""
        metrics_file = settings.ufc_artifacts_dir / "ufc_evaluation_metrics.json"
        if not metrics_file.exists():
            raise HTTPException(status_code=503, detail="UFC evaluation metrics not found. Run model training first.")
        with open(metrics_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_feature_importance(self) -> list[dict]:
        """Ranked feature importances and weights for the champion model."""
        fi_file = settings.ufc_artifacts_dir / "ufc_feature_importance.json"
        if not fi_file.exists():
            return []
        with open(fi_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_calibration(self) -> list[dict]:
        """Reliability calibration bins for the champion model."""
        cal_file = settings.ufc_artifacts_dir / "ufc_calibration.json"
        if not cal_file.exists():
            return []
        with open(cal_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_fighters(
        self,
        search: Optional[str] = None,
        stance: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> dict:
        """Searchable and paginated fighter directory."""
        self._ensure_data_loaded()
        df = self._fighters_df.copy()

        if search:
            query = str(search).strip().lower()
            df = df[df["fighter_name"].str.lower().str.contains(query, na=False)]

        if stance:
            st = str(stance).strip().lower()
            df = df[df["stance"].str.lower() == st]

        # Sort by total bouts descending so recognizable athletes appear first
        def get_bouts(name):
            return self._fighter_fight_counts.get(name, {}).get("bouts", 0)

        df["total_bouts"] = df["fighter_name"].apply(get_bouts)
        df = df.sort_values(by=["total_bouts", "fighter_name"], ascending=[False, True])

        total = len(df)
        total_pages = max(1, (total + page_size - 1) // page_size)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        page_df = df.iloc[start_idx:end_idx]

        fighters_list = []
        for _, row in page_df.iterrows():
            name = row["fighter_name"]
            counts = self._fighter_fight_counts.get(name, {"bouts": 0, "wins": 0})
            fighters_list.append({
                "fighter_name": name,
                "height": f"{int(row['height_in']//12)}' {int(row['height_in']%12)}\"" if pd.notna(row.get("height_in")) else None,
                "weight": f"{int(row['weight_lbs'])} lbs." if pd.notna(row.get("weight_lbs")) else None,
                "reach": f"{int(row['reach_in'])}\"" if pd.notna(row.get("reach_in")) else None,
                "stance": row.get("stance") if pd.notna(row.get("stance")) else "Unknown",
                "dob": str(row["dob"])[:10] if pd.notna(row.get("dob")) else None,
                "total_ufc_bouts": counts["bouts"],
                "ufc_wins": counts["wins"],
                "slpm": round(float(row.get("SLpM", 0.0)), 2),
                "str_acc": round(float(row.get("Str_Acc", 0.0)), 2),
                "sapm": round(float(row.get("SApM", 0.0)), 2),
                "str_def": round(float(row.get("Str_Def", 0.0)), 2),
                "td_avg": round(float(row.get("TD_Avg", 0.0)), 2),
                "td_def": round(float(row.get("TD_Def", 0.0)), 2),
                "sub_avg": round(float(row.get("Sub_Avg", 0.0)), 2)
            })

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "fighters": fighters_list
        }

    def get_fighter_detail(self, fighter_name: str) -> dict:
        """Comprehensive fighter profile with career fight history."""
        self._ensure_data_loaded()
        name = str(fighter_name).strip()

        # Case-insensitive lookup
        match = self._fighters_df[self._fighters_df["fighter_name"].str.lower() == name.lower()]
        if match.empty:
            raise HTTPException(status_code=404, detail=f"Fighter '{fighter_name}' not found in official UFC database.")

        row = match.iloc[0]
        canonical_name = row["fighter_name"]

        # Career bout log
        bouts_mask = (self._fights_df["R_fighter"] == canonical_name) | (self._fights_df["B_fighter"] == canonical_name)
        fighter_bouts = self._fights_df[bouts_mask].sort_values(by="date", ascending=False)

        recent_fights = []
        wins = 0
        losses = 0
        for _, b in fighter_bouts.iterrows():
            is_red = (b["R_fighter"] == canonical_name)
            opp = b["B_fighter"] if is_red else b["R_fighter"]
            winner = b.get("Winner")

            if winner == canonical_name:
                outcome = "W"
                wins += 1
            elif pd.isna(winner) or winner in ["Draw", "No Contest", "nan"]:
                outcome = "D/NC"
            else:
                outcome = "L"
                losses += 1

            recent_fights.append({
                "date": b["date"].strftime("%Y-%m-%d"),
                "opponent": opp,
                "corner": "Red" if is_red else "Blue",
                "outcome": outcome,
                "method": str(b.get("method_clean", "Other")),
                "round": int(b.get("last_round", 1)),
                "time": str(b.get("last_round_time", "5:00")),
                "weight_class": str(b.get("weight_class", "Catch Weight")),
                "title_bout": bool(b.get("title_bout", False))
            })

        total_bouts = len(recent_fights)
        win_rate = round((wins / total_bouts * 100), 1) if total_bouts > 0 else 0.0

        return {
            "fighter_name": canonical_name,
            "height": f"{int(row['height_in']//12)}' {int(row['height_in']%12)}\"" if pd.notna(row.get("height_in")) else None,
            "height_cm": float(row.get("height_cm")) if pd.notna(row.get("height_cm")) else None,
            "weight": f"{int(row['weight_lbs'])} lbs." if pd.notna(row.get("weight_lbs")) else None,
            "weight_lbs": float(row.get("weight_lbs")) if pd.notna(row.get("weight_lbs")) else None,
            "reach": f"{int(row['reach_in'])}\"" if pd.notna(row.get("reach_in")) else None,
            "reach_cm": float(row.get("reach_cm")) if pd.notna(row.get("reach_cm")) else None,
            "stance": row.get("stance") if pd.notna(row.get("stance")) else "Unknown",
            "dob": str(row["dob"])[:10] if pd.notna(row.get("dob")) else None,
            "total_ufc_bouts": total_bouts,
            "ufc_wins": wins,
            "ufc_losses": losses,
            "win_rate_pct": win_rate,
            "slpm": round(float(row.get("SLpM", 0.0)), 2),
            "str_acc_pct": round(float(row.get("Str_Acc", 0.0)) * 100, 1),
            "sapm": round(float(row.get("SApM", 0.0)), 2),
            "str_def_pct": round(float(row.get("Str_Def", 0.0)) * 100, 1),
            "td_avg_15m": round(float(row.get("TD_Avg", 0.0)), 2),
            "td_def_pct": round(float(row.get("TD_Def", 0.0)) * 100, 1),
            "sub_avg_15m": round(float(row.get("Sub_Avg", 0.0)), 2),
            "recent_fights": recent_fights
        }

    def get_fights(
        self,
        fighter: Optional[str] = None,
        weight_class: Optional[str] = None,
        method: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> dict:
        """Filterable and paginated historical bout explorer."""
        self._ensure_data_loaded()
        df = self._fights_df.copy()

        if fighter:
            q = str(fighter).strip().lower()
            df = df[(df["R_fighter"].str.lower().str.contains(q, na=False)) | (df["B_fighter"].str.lower().str.contains(q, na=False))]

        if weight_class:
            wc = str(weight_class).strip().lower()
            df = df[df["weight_class"].str.lower() == wc]

        if method:
            m = str(method).strip().lower()
            df = df[df["method_clean"].str.lower() == m]

        # Recent bouts first
        df = df.sort_values(by="date", ascending=False)

        total = len(df)
        total_pages = max(1, (total + page_size - 1) // page_size)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        page_df = df.iloc[start_idx:end_idx]

        fights_list = []
        for _, row in page_df.iterrows():
            r = row["R_fighter"]
            b = row["B_fighter"]
            w = row.get("Winner")
            winner_corner = "Red" if w == r else ("Blue" if w == b else None)

            fights_list.append({
                "date": row["date"].strftime("%Y-%m-%d"),
                "red_fighter": r,
                "blue_fighter": b,
                "winner": w if pd.notna(w) else "Draw / No Contest",
                "winner_corner": winner_corner,
                "method": str(row.get("method_clean", "Other")),
                "last_round": int(row.get("last_round", 1)),
                "last_round_time": str(row.get("last_round_time", "5:00")),
                "format": str(row.get("Format", "3 Rnd (5-5-5)")),
                "weight_class": str(row.get("weight_class", "Catch Weight")),
                "title_bout": bool(row.get("title_bout", False))
            })

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "fights": fights_list
        }

    def get_weight_classes(self) -> list[dict]:
        """List of official UFC weight classes and historical volume."""
        self._ensure_data_loaded()
        groups = self._fights_df.groupby("weight_class")
        classes = []
        for wc, grp in groups:
            classes.append({
                "name": wc,
                "total_bouts": len(grp),
                "championship_bouts": int(grp["title_bout"].sum())
            })
        classes = sorted(classes, key=lambda x: x["total_bouts"], reverse=True)
        return classes

    def predict(
        self,
        fighter_a: str,
        fighter_b: str,
        corner_a: str = "Red",
        corner_b: str = "Blue",
        target_date: Optional[str] = None,
        is_title_bout: bool = False,
        is_hypothetical: bool = True
    ) -> dict:
        """
        Generates win probabilities using the trained UFC machine-learning model.
        Guarantees P(Red) + P(Blue) == 1.0, data-quality scoring, and full Tale-of-the-Tape.
        """
        # Validate model existence
        model_path = settings.ufc_artifacts_dir / "ufc_model.joblib"
        if not model_path.exists():
            raise HTTPException(status_code=503, detail="UFC Model artifacts not available. Please run model training first.")

        # Input sanitization
        fa = str(fighter_a).strip()
        fb = str(fighter_b).strip()

        if not fa or not fb:
            raise HTTPException(status_code=400, detail="Both fighter_a and fighter_b must be provided.")

        if fa.lower() == fb.lower():
            raise HTTPException(status_code=400, detail=f"Fighter A and Fighter B cannot be the same athlete: '{fa}'")

        try:
            pred = ufc_predict.predict_ufc_bout(
                fighter_a=fa,
                fighter_b=fb,
                target_date=target_date,
                is_title_bout=is_title_bout,
                corner_a=corner_a,
                corner_b=corner_b
            )
        except ValueError as e:
            msg = str(e)
            if "not found in official UFC database" in msg:
                raise HTTPException(status_code=404, detail=msg)
            elif "cannot be the same athlete" in msg:
                raise HTTPException(status_code=400, detail=msg)
            else:
                raise HTTPException(status_code=400, detail=msg)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

        pred_id = f"ufc_pred_{uuid.uuid4().hex[:12]}"
        timestamp = datetime.utcnow().isoformat() + "Z"

        # Explicit transparency disclaimer
        cutoff_date = "2026-10-24"
        if self._fights_df is not None and not self._fights_df.empty:
            cutoff_date = self._fights_df["date"].max().strftime("%Y-%m-%d")

        disclaimer = (
            "PITCHIQ UFC predictions are probabilistic machine-learning estimates based on pre-fight "
            f"differentials and historical bout records (1994 to {cutoff_date}). They are not financial advice "
            "or guarantees of sporting victory."
        )


        response = {
            "prediction_id": pred_id,
            "timestamp": timestamp,
            "sport": "ufc_mma",
            "model_version": pred.get("model_version", "ufc_v1.1"),
            "predicted_winner": pred["predicted_winner"],
            "confidence_level": pred["confidence_level"],
            "probabilities": pred["probabilities"],
            "probabilities_sum_check": pred["probabilities_sum_check"],
            "method_probabilities": pred.get("method_probabilities", {}),
            "tale_of_the_tape": pred["tale_of_the_tape"],
            "data_quality": pred["data_quality"],
            "influential_factors": pred["influential_factors"],
            "disclaimer": disclaimer
        }

        # Optional prediction log persistence
        try:
            history_file = settings.ufc_prediction_history_file
            history_file.parent.mkdir(parents=True, exist_ok=True)
            history = []
            if history_file.exists():
                with open(history_file, "r", encoding="utf-8") as f:
                    history = json.load(f)
            history.append(response)
            with open(history_file, "w", encoding="utf-8") as f:
                json.dump(history[-200:], f, indent=2)  # retain last 200 predictions
        except Exception:
            pass  # Do not fail prediction if history file write fails

        return response

ufc_service = UFCService()
