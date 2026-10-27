"""
Backend API Tests for PITCHIQ
Tests FastAPI endpoints, error status codes, request validation, and data formatting.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["data_ready"] is True

def test_api_meta():
    response = client.get("/api/meta")
    assert response.status_code == 200
    data = response.json()
    assert data["product_name"] == "PITCHIQ"
    assert len(data["classes"]) == 3

def test_get_teams():
    response = client.get("/api/teams")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 20
    assert any(t["name"] == "Arsenal" for t in data["teams"])

def test_get_team_analysis():
    response = client.get("/api/teams/Arsenal/analysis")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Arsenal"
    assert data["matches_played"] > 0
    assert "home_record" in data
    assert "away_record" in data
    assert len(data["recent_matches"]) > 0

def test_get_team_analysis_not_found():
    response = client.get("/api/teams/NonExistentFC/analysis")
    assert response.status_code == 404

def test_get_matches_pagination():
    response = client.get("/api/matches?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["matches"]) == 10
    assert data["total"] > 1000

def test_get_upcoming_fixtures():
    response = client.get("/api/fixtures")
    assert response.status_code == 200
    data = response.json()
    assert "fixtures" in data
    assert "source" in data

def test_predict_endpoint_valid():
    payload = {
        "home_team": "Arsenal",
        "away_team": "Chelsea",
        "is_hypothetical": True
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["home_team"] == "Arsenal"
    assert data["away_team"] == "Chelsea"
    assert "probabilities" in data
    probs = data["probabilities"]
    assert probs["home_win"]["code"] == "H"
    assert probs["draw"]["code"] == "D"
    assert probs["away_win"]["code"] == "A"
    total = probs["home_win"]["probability"] + probs["draw"]["probability"] + probs["away_win"]["probability"]
    assert abs(total - 100.0) < 0.2

def test_predict_endpoint_same_team_error():
    payload = {
        "home_team": "Arsenal",
        "away_team": "Arsenal"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    assert "identical" in response.json()["detail"].lower()

def test_get_model_metrics():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "main_model" in data
    assert "confusion_matrix" in data
    assert data["main_model"]["accuracy"] > 0.40

def test_get_data_summary():
    response = client.get("/api/data/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_valid_matches"] >= 1400
