"""
FastAPI Route Endpoints for PITCHIQ
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.prediction import (
    PredictRequest,
    PredictionResponse,
    TeamSummary,
    FixturesResponse,
    DataSummaryResponse
)
from app.services.data_service import data_service
from app.services.prediction_service import prediction_service
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def get_health():
    """Health check and subsystem readiness."""
    model_ready = (settings.artifacts_dir / "model.joblib").exists()
    data_ready = (settings.processed_data_dir / "matches_clean.csv").exists()
    return {
        "status": "healthy" if (model_ready and data_ready) else "degraded",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "model_loaded": model_ready,
        "data_ready": data_ready,
        "competition": settings.competition_name
    }

@router.get("/meta")
def get_meta():
    """Application metadata, target classes, and framework versions."""
    return {
        "product_name": "PITCHIQ",
        "tagline": "Read the game differently.",
        "description": "Football match outcome prediction and analytics powered by leakage-safe machine learning.",
        "academic_context": "Machine Learning Experiment 11 Project",
        "competition": settings.competition_name,
        "target_variable": "Full-Time Match Result (FTR)",
        "classes": [
            {"code": "H", "label": "Home Win", "index": 0},
            {"code": "D", "label": "Draw", "index": 1},
            {"code": "A", "label": "Away Win", "index": 2}
        ],
        "model_type": "Random Forest Classifier (Scikit-Learn Pipeline with StandardScaler)",
        "split_methodology": "Chronological (Time-Aware Train/Test Separation)"
    }

@router.get("/competitions")
def get_competitions():
    """Supported football competitions."""
    return [
        {
            "id": "e0",
            "name": "English Premier League",
            "country": "England",
            "division": "E0",
            "seasons": ["2021-2022", "2022-2023", "2023-2024", "2024-2025"],
            "status": "active"
        }
    ]

@router.get("/teams")
def get_teams():
    """List of all teams in the processed historical dataset."""
    teams = data_service.get_teams()
    return {"count": len(teams), "teams": teams}

@router.get("/teams/{team_name}/analysis")
def get_team_analysis(team_name: str):
    """Deep analysis and recent match history for a specific team."""
    analysis = data_service.get_team_analysis(team_name)
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Team '{team_name}' not found in dataset.")
    return analysis

@router.get("/matches")
def get_matches(
    team: Optional[str] = Query(None, description="Filter by team name"),
    season: Optional[str] = Query(None, description="Filter by season code, e.g. '2324'"),
    result: Optional[str] = Query(None, description="Filter by result 'H', 'D', 'A'"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size")
):
    """Filterable and paginated historical match explorer."""
    return data_service.get_matches(team=team, season=season, result=result, page=page, page_size=page_size)

@router.get("/fixtures")
def get_fixtures(force_refresh: bool = False):
    """Upcoming Premier League fixtures feed."""
    return prediction_service.get_upcoming_fixtures(force_refresh=force_refresh)

@router.post("/predict", response_model=PredictionResponse)
def post_predict(payload: PredictRequest):
    """
    Generates probabilistic match outcome forecast using the trained model.
    Validates teams and ensures pre-match statistics strictly precede kickoff.
    """
    try:
        res = prediction_service.predict(
            home_team=payload.home_team,
            away_team=payload.away_team,
            match_date=payload.match_date,
            fixture_id=payload.fixture_id,
            is_hypothetical=payload.is_hypothetical
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except FileNotFoundError as fe:
        raise HTTPException(status_code=503, detail=str(fe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/predictions/history")
def get_prediction_history():
    """Audit log of generated predictions."""
    history = prediction_service.get_prediction_history()
    return {"count": len(history), "history": history}

@router.get("/model/metrics")
def get_model_metrics():
    """Held-out chronological evaluation metrics for Baseline vs Random Forest."""
    metrics = prediction_service.get_model_metrics()
    if "error" in metrics:
        raise HTTPException(status_code=503, detail=metrics["error"])
    return metrics

@router.get("/model/feature-importance")
def get_feature_importance():
    """Ranked feature importances from the trained model."""
    return prediction_service.get_feature_importance()

@router.get("/model/confusion-matrix")
def get_confusion_matrix():
    """3x3 confusion matrix comparing actual vs predicted outcomes."""
    return prediction_service.get_confusion_matrix()

@router.get("/data/summary")
def get_data_summary():
    """Dataset quality report and summary statistics."""
    return data_service.get_summary()

@router.post("/data/refresh")
def post_data_refresh():
    """Refreshes upcoming fixtures and checks data freshness."""
    try:
        fixtures_res = prediction_service.get_upcoming_fixtures(force_refresh=True)
        return {
            "status": "success",
            "message": "Upcoming fixtures refreshed successfully.",
            "fixtures_count": fixtures_res.get("count", 0),
            "last_updated": fixtures_res.get("last_updated")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data refresh failed: {str(e)}")
