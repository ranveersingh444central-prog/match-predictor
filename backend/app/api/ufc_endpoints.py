"""
FastAPI Route Endpoints for PITCHIQ UFC / MMA Analytics & Prediction Subsystem
Mounted under /api/ufc. Completely isolated from football endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from app.schemas.ufc_schemas import (
    UFCPredictRequest,
    UFCPredictionResponse,
    UFCFightersResponse,
    UFCFighterDetail,
    UFCFightsResponse,
    UFCStatusResponse,
    UFCWeightClass
)
from app.services.ufc_service import ufc_service

router = APIRouter()

@router.get("/status", response_model=UFCStatusResponse)
def get_ufc_status():
    """UFC subsystem health check, model readiness, and dataset boundaries."""
    return ufc_service.get_status()

@router.get("/meta")
def get_ufc_meta():
    """UFC data provenance, CC0 Public Domain license evidence, and ML methodology."""
    return ufc_service.get_metadata()

@router.get("/model/metrics")
def get_ufc_model_metrics():
    """Comparative evaluation metrics: Baseline vs. Logistic Regression vs. Random Forest."""
    return ufc_service.get_evaluation_metrics()

@router.get("/model/feature-importance")
def get_ufc_feature_importance():
    """Ranked feature importances and pre-fight differential coefficients."""
    return ufc_service.get_feature_importance()

@router.get("/model/calibration")
def get_ufc_calibration():
    """Reliability calibration curve data across probability bins."""
    return ufc_service.get_calibration()

@router.get("/fighters", response_model=UFCFightersResponse)
def get_ufc_fighters(
    search: Optional[str] = Query(None, description="Search by fighter name"),
    stance: Optional[str] = Query(None, description="Filter by stance: Orthodox, Southpaw, Switch"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page")
):
    """Searchable and paginated directory of 3,500+ UFC athletes."""
    return ufc_service.get_fighters(search=search, stance=stance, page=page, page_size=page_size)

@router.get("/fighters/{fighter_name}", response_model=UFCFighterDetail)
def get_ufc_fighter_detail(fighter_name: str):
    """Detailed biographical attributes, striking/grappling stats, and complete UFC fight history."""
    return ufc_service.get_fighter_detail(fighter_name)

@router.get("/fights", response_model=UFCFightsResponse)
def get_ufc_fights(
    fighter: Optional[str] = Query(None, description="Filter bouts involving this fighter"),
    weight_class: Optional[str] = Query(None, description="Filter by weight class"),
    method: Optional[str] = Query(None, description="Filter by method: KO/TKO, Submission, Decision"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page")
):
    """Filterable and paginated historical bout explorer covering 6,000+ completed bouts."""
    return ufc_service.get_fights(
        fighter=fighter,
        weight_class=weight_class,
        method=method,
        page=page,
        page_size=page_size
    )

@router.get("/weight-classes", response_model=list[UFCWeightClass])
def get_ufc_weight_classes():
    """List of official UFC weight divisions and historical bout distribution."""
    return ufc_service.get_weight_classes()

@router.post("/predict", response_model=UFCPredictionResponse)
def post_ufc_predict(payload: UFCPredictRequest):
    """
    Generates probabilistic win forecast between Fighter A and Fighter B using the trained UFC model.
    Guarantees Red + Blue win probabilities sum to 100%, includes full Tale-of-the-Tape,
    confidence rating, and finishing method forecast.
    """
    return ufc_service.predict(
        fighter_a=payload.fighter_a,
        fighter_b=payload.fighter_b,
        corner_a=payload.corner_a,
        corner_b=payload.corner_b,
        target_date=payload.target_date,
        is_title_bout=payload.is_title_bout,
        is_hypothetical=payload.is_hypothetical
    )
