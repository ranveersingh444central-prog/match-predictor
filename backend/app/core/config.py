"""
Configuration Settings for PITCHIQ Backend
"""

from pathlib import Path
from pydantic import BaseModel

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BACKEND_DIR.parent
ML_DIR = ROOT_DIR / "ml"

class Settings(BaseModel):
    app_name: str = "PITCHIQ Football Match Predictor"
    app_version: str = "1.0.0"
    competition_name: str = "English Premier League"
    competition_code: str = "E0"
    
    # Football Paths
    ml_dir: Path = ML_DIR
    raw_data_dir: Path = ML_DIR / "data" / "raw"
    processed_data_dir: Path = ML_DIR / "data" / "processed"
    artifacts_dir: Path = ML_DIR / "artifacts"
    reports_dir: Path = ML_DIR / "reports"
    prediction_history_file: Path = ML_DIR / "data" / "prediction_history.json"
    
    # UFC / MMA Paths
    ufc_raw_data_dir: Path = ML_DIR / "data" / "ufc" / "raw"
    ufc_processed_data_dir: Path = ML_DIR / "data" / "ufc" / "processed"
    ufc_artifacts_dir: Path = ML_DIR / "artifacts" / "ufc"
    ufc_reports_dir: Path = ML_DIR / "reports" / "ufc"
    ufc_prediction_history_file: Path = ML_DIR / "data" / "ufc" / "prediction_history.json"
    
    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
