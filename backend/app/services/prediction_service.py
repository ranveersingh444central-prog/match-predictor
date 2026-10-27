"""
Prediction Service Integration for FastAPI Backend
Interfaces with the machine learning model artifacts and feature pipeline.
"""

import sys
import json
from pathlib import Path
from typing import Optional

from app.core.config import settings

# Add ml/src to sys.path
ml_src_path = str(settings.ml_dir / "src")
if ml_src_path not in sys.path:
    sys.path.insert(0, ml_src_path)

import predict as ml_predict
import fixtures_updater

class PredictionService:
    @staticmethod
    def predict(
        home_team: str,
        away_team: str,
        match_date: Optional[str] = None,
        fixture_id: Optional[str] = None,
        is_hypothetical: bool = False
    ) -> dict:
        return ml_predict.predict_match(
            home_team=home_team,
            away_team=away_team,
            match_date=match_date,
            fixture_id=fixture_id,
            is_hypothetical=is_hypothetical
        )

    @staticmethod
    def get_upcoming_fixtures(force_refresh: bool = False) -> dict:
        if force_refresh:
            fixtures_updater.fetch_and_parse_upcoming_fixtures(force_refresh=True)
        return fixtures_updater.get_upcoming_fixtures()

    @staticmethod
    def get_prediction_history() -> list[dict]:
        history_file = settings.prediction_history_file
        if not history_file.exists():
            return []
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
            return history[::-1]  # most recent first
        except Exception:
            return []

    @staticmethod
    def get_model_metrics() -> dict:
        metrics_file = settings.artifacts_dir / "evaluation_metrics.json"
        if not metrics_file.exists():
            return {"error": "Evaluation metrics not available. Model has not been trained."}
        with open(metrics_file, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def get_feature_importance() -> list[dict]:
        fi_file = settings.artifacts_dir / "feature_importance.json"
        if not fi_file.exists():
            return []
        with open(fi_file, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def get_confusion_matrix() -> dict:
        cm_file = settings.artifacts_dir / "confusion_matrix.json"
        if not cm_file.exists():
            return {}
        with open(cm_file, "r", encoding="utf-8") as f:
            return json.load(f)

prediction_service = PredictionService()
