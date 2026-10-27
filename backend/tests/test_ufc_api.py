"""
Backend API Test Suite for PITCHIQ UFC / MMA Subsystem
Tests FastAPI endpoints, error status codes, request validation,
Tale-of-the-Tape data contracts, probability consistency, and regression safety.
"""

import sys
from pathlib import Path
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.core.config import settings
import pandas as pd

client = TestClient(app)

def get_expected_dataset_cutoff() -> str:
    """
    Derives ground-truth cutoff date directly from processed fight records fixture.
    Maintains robustness when new verified events are legitimately added.
    For the verified refreshed combat archive, this date is 2026-10-24.
    """
    fights_file = settings.ufc_processed_data_dir / "fights_clean.csv"
    if fights_file.exists():
        df = pd.read_csv(fights_file, usecols=["date"])
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        max_dt = df["date"].max()
        if pd.notna(max_dt):
            return max_dt.strftime("%Y-%m-%d")
    return "2026-10-24"

def test_ufc_api_status():
    """Verify UFC status endpoint returns healthy state and exact verified dataset cutoff date."""
    expected_cutoff = get_expected_dataset_cutoff()
    assert expected_cutoff == "2026-10-24", "Verified refreshed dataset fixture must have cutoff 2026-10-24"
    response = client.get("/api/ufc/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["sport"] == "ufc_mma"
    assert data["model_loaded"] is True
    assert data["data_ready"] is True
    assert data["total_bouts"] >= 6000
    assert data["total_athletes"] >= 3500
    assert data["dataset_cutoff"] == expected_cutoff
    assert "disclaimer" in data

def test_ufc_api_meta():
    """Verify UFC metadata returns provenance, attribution, and target variables."""
    expected_cutoff = get_expected_dataset_cutoff()
    response = client.get("/api/ufc/meta")
    assert response.status_code == 200
    data = response.json()
    assert data["sport"] == "ufc_mma"
    assert "provenance" in data
    prov = data["provenance"]
    assert "software_license" in prov or "license" in prov
    assert "UFCStats.com" in prov.get("primary_source", "") or "attribution" in prov
    assert len(data["classes"]) == 2
    assert data["dataset_cutoff"] == expected_cutoff
    assert "leakage_safeguards" in data

def test_ufc_api_model_metrics():
    """Verify UFC model metrics endpoint returns comparative evaluation data."""
    response = client.get("/api/ufc/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "champion_model" in data
    assert "models_evaluated" in data
    models = data["models_evaluated"]
    assert "baseline_prior" in models
    assert "random_forest" in models
    assert "logistic_regression" in models
    assert "dataset_split" in data
    assert data["dataset_split"]["test_samples"] > 800

def test_ufc_api_feature_importance():
    """Verify UFC feature importance endpoint returns ranked feature list."""
    response = client.get("/api/ufc/model/feature-importance")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 30
    assert "feature" in data[0]
    assert "importance" in data[0]

def test_ufc_api_calibration():
    """Verify UFC calibration endpoint returns reliability curve data."""
    response = client.get("/api/ufc/model/calibration")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    assert "predicted_probability_mid" in data[0]
    assert "actual_win_rate" in data[0]

def test_ufc_get_fighters_pagination_and_search():
    """Verify fighters endpoint supports pagination and search filtering."""
    # Pagination test
    response = client.get("/api/ufc/fighters?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert len(data["fighters"]) == 10
    assert data["total"] >= 3500

    # Search test
    search_res = client.get("/api/ufc/fighters?search=Khabib")
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert any("Khabib" in f["fighter_name"] for f in search_data["fighters"])

def test_ufc_get_fighter_detail_success_and_not_found():
    """Verify detailed fighter profile retrieval and 404 for unknown athletes."""
    # Known athlete
    response = client.get("/api/ufc/fighters/Jon Jones")
    assert response.status_code == 200
    data = response.json()
    assert data["fighter_name"] == "Jon Jones"
    assert data["total_ufc_bouts"] >= 20
    assert data["ufc_wins"] >= 19
    assert len(data["recent_fights"]) >= 20
    assert data["slpm"] > 0

    # Unknown athlete
    nf_response = client.get("/api/ufc/fighters/NonExistentFighter999")
    assert nf_response.status_code == 404

def test_ufc_get_fights_pagination_and_filtering():
    """Verify historical fights explorer supports pagination and query filters."""
    # Pagination
    response = client.get("/api/ufc/fights?page=1&page_size=15")
    assert response.status_code == 200
    data = response.json()
    assert len(data["fights"]) == 15
    assert data["total"] >= 6000

    # Filter by fighter
    f_res = client.get("/api/ufc/fights?fighter=Conor McGregor")
    assert f_res.status_code == 200
    f_data = f_res.json()
    assert all("Conor McGregor" in (f["red_fighter"] + f["blue_fighter"]) for f in f_data["fights"])

    # Filter by method
    m_res = client.get("/api/ufc/fights?method=KO/TKO&page_size=10")
    assert m_res.status_code == 200
    m_data = m_res.json()
    assert all(f["method"] == "KO/TKO" for f in m_data["fights"])

def test_ufc_get_weight_classes():
    """Verify weight classes endpoint returns canonical UFC divisions."""
    response = client.get("/api/ufc/weight-classes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    names = [wc["name"] for wc in data]
    assert "Heavyweight" in names
    assert "Lightweight" in names
    assert "Welterweight" in names

def test_ufc_predict_endpoint_valid():
    """Verify POST /api/ufc/predict returns normalized probabilities, Tale of the Tape, and disclaimer."""
    payload = {
        "fighter_a": "Jon Jones",
        "fighter_b": "Daniel Cormier",
        "corner_a": "Red",
        "corner_b": "Blue",
        "is_title_bout": True,
        "is_hypothetical": True
    }
    response = client.post("/api/ufc/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["sport"] == "ufc_mma"
    assert data["model_version"] == "ufc_v1.1"
    assert data["predicted_winner"] in ["Jon Jones", "Daniel Cormier"]
    assert "probabilities" in data

    p_a = data["probabilities"]["fighter_a"]["probability"]
    p_b = data["probabilities"]["fighter_b"]["probability"]
    assert 0.0 <= p_a <= 1.0
    assert 0.0 <= p_b <= 1.0
    assert abs((p_a + p_b) - 1.0) < 1e-5

    # Tale of the tape presence
    assert "tale_of_the_tape" in data
    assert data["tale_of_the_tape"]["fighter_a"]["name"] == "Jon Jones"
    assert data["tale_of_the_tape"]["fighter_b"]["name"] == "Daniel Cormier"

    # Disclaimer presence
    assert "disclaimer" in data
    assert "not financial advice" in data["disclaimer"].lower()

def test_ufc_predict_same_fighter_error():
    """Verify predicting the same athlete against themselves returns HTTP 400."""
    payload = {
        "fighter_a": "Jon Jones",
        "fighter_b": "Jon Jones"
    }
    response = client.post("/api/ufc/predict", json=payload)
    assert response.status_code == 400
    assert "cannot be the same athlete" in response.json()["detail"].lower()

def test_ufc_predict_unknown_fighter_error():
    """Verify predicting an unrecorded athlete returns HTTP 404."""
    payload = {
        "fighter_a": "NonExistentMMAAthleteX",
        "fighter_b": "Jon Jones"
    }
    response = client.post("/api/ufc/predict", json=payload)
    assert response.status_code == 404
    assert "not found in official ufc database" in response.json()["detail"].lower()

def test_ufc_predict_missing_model_error():
    """Verify HTTP 503 is returned if model artifact is unavailable."""
    from app.core.config import settings
    fake_path = settings.ml_dir / "non_existent_artifacts" / "ufc_model.joblib"
    with patch.object(settings, "ufc_artifacts_dir", fake_path.parent):
        payload = {
            "fighter_a": "Jon Jones",
            "fighter_b": "Daniel Cormier"
        }
        response = client.post("/api/ufc/predict", json=payload)
        assert response.status_code == 503
        assert "not available" in response.json()["detail"].lower()

def test_ufc_dataset_unavailable_handling():
    """Verify service degradation and 503 error handling when clean dataset is missing."""
    from app.services.ufc_service import UFCService
    from fastapi import HTTPException
    with patch("app.services.ufc_service.settings.ufc_processed_data_dir", Path("/non_existent_ufc_data")):
        degraded_svc = UFCService()
        status = degraded_svc.get_status()
        assert status["status"] == "degraded"
        assert status["data_ready"] is False

        # Attempting to query fighters from missing processed data raises 503
        with pytest.raises(HTTPException) as exc_info:
            degraded_svc.get_fighters()
        assert exc_info.value.status_code == 503
        assert "not available" in exc_info.value.detail.lower()
