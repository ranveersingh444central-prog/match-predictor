# PITCHIQ — Football Match Outcome Prediction & Analytics Platform

> **“Read the game differently.”**  
> *University Machine Learning Experiment 11 Project*

PITCHIQ is a football analytics and match outcome forecasting platform. Powered by historical Premier League match records and a leakage-safe machine learning pipeline, it estimates the probability distribution across Home Win ($H$), Draw ($D$), and Away Win ($A$) without relying on synthetic data or post-kickoff leaks.

Designed with the visual atmosphere of a luxury hospitality publication (botanical greens, warm ivory, understated serif typography) and the analytical clarity of a sports intelligence research tool.

---

## 1. System Architecture

```
pitchiq/
├── frontend/               # React 19 + TypeScript + Vite + Vanilla CSS
│   ├── src/
│   │   ├── components/     # TacticalPitch, Navigation, Footer
│   │   ├── pages/          # Overview, Predictor, Teams, ModelLab, DataExplorer, Methodology
│   │   ├── services/       # Centralized API client (fetch with proxy)
│   │   ├── types/          # TypeScript contracts & interfaces
│   │   ├── styles/         # CSS design tokens & botanical editorial theme
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/                # Python 3.10+ FastAPI Application
│   ├── app/
│   │   ├── api/            # REST endpoints (/predict, /teams, /fixtures, /metrics)
│   │   ├── core/           # Configuration & CORS settings
│   │   ├── schemas/        # Pydantic request & response validation
│   │   ├── services/       # Data querying & ML inference wrappers
│   │   └── main.py         # Application entry point
│   ├── tests/              # TestClient endpoint unit tests
│   └── requirements.txt
├── ml/                     # Machine Learning Pipeline
│   ├── data/
│   │   ├── raw/            # Verified CSVs (seasons 21/22, 22/23, 23/24, 24/25)
│   │   └── processed/      # Cleaned matches (1,520) & engineered feature rows (1,472)
│   ├── src/
│   │   ├── data_loader.py  # Historical & upcoming fixtures acquisition
│   │   ├── validation.py   # Data validation & data quality report generator
│   │   ├── features.py     # Causal backward rolling form & leakage prevention
│   │   ├── train.py        # Chronological train/test split & Random Forest training
│   │   ├── predict.py      # Inference engine & prediction audit trail
│   │   └── fixtures_updater.py # Scheduled fixtures feed parser
│   ├── artifacts/          # Persisted models (.joblib) & metrics (.json)
│   ├── reports/            # Data quality report & metadata
│   └── tests/              # Leakage prevention & class mapping tests
├── docs/
│   └── VIVA_PREPARATION_GUIDE.md # Academic viva defense questions & answers
├── .env.example
├── .gitignore
└── README.md
```

---

## 2. Machine Learning Pipeline & Results

### Data Provenance
- **Provider:** [Football-Data.co.uk](https://www.football-data.co.uk/)
- **Competition:** English Premier League (`E0`)
- **Seasons Ingested:** 2021–2022, 2022–2023, 2023–2024, 2024–2025
- **Verified Clean Matches:** **1,520 matches** across 26 unique clubs
- **Outcome Distribution:** Home Win 44.54% (677), Draw 23.03% (350), Away Win 32.43% (493)

### Zero-Leakage Feature Engineering
Every feature is computed strictly using matches played prior to the target kickoff ($t < t_{\text{match}}$):
- **Lagged Rolling Form ($W=5$):** Points, Points Per Game (PPG), Goals Scored, Goals Conceded, Goal Difference, Shots on Target.
- **Venue-Specific Form:** Home PPG when host, Away PPG when visitor.
- **Rest & Schedule Dynamics:** Days since previous fixture, rest differential.
- **Head-to-Head History:** Previous 3 encounters prior to target date.

### Chronological Train / Test Split
To accurately reflect live deployment, data is partitioned by time rather than random shuffling:
- **Training Horizon:** 1,148 matches (`2021-09-11` to `2024-09-28`)
- **Held-Out Test Horizon:** 324 unseen matches (`2024-09-28` to `2025-05-25`)

### Empirical Results

| Metric | Dummy Classifier (Baseline) | Random Forest Pipeline (PITCHIQ) | Improvement |
| :--- | :--- | :--- | :--- |
| **Accuracy** | 41.98% | **45.68%** | **+3.70%** |
| **Macro Precision** | 0.1399 | **0.3989** | **+0.2590** |
| **Macro Recall** | 0.3333 | **0.4129** | **+0.0796** |
| **Macro F1-Score** | 0.1971 | **0.3957** | **+0.1986** |
| **Multiclass Log Loss** | 1.1340 | **1.0498** | Calibrated |
| **Brier Score** | 0.6820 | **0.6313** | Calibrated |

---

## 3. Installation & Quick Start

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### Step 1: Clone & Setup Backend Virtual Environment
```bash
# Navigate to project root
cd "sports predictor 2"

# Create virtual environment
python -m venv backend/venv

# Activate virtual environment
# Windows (PowerShell):
backend\venv\Scripts\Activate.ps1
# macOS/Linux:
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### Step 2: Run Data & Training Pipeline
```bash
# 1. Download verified historical data & upcoming fixtures
python ml/src/data_loader.py

# 2. Validate records & build data quality report
python ml/src/validation.py

# 3. Engineer leakage-free rolling features
python ml/src/features.py

# 4. Train models & compute chronological held-out metrics
python ml/src/train.py

# 5. Parse upcoming fixtures feed
python ml/src/fixtures_updater.py
```

### Step 3: Run Automated Tests
```bash
# Run ML leakage prevention tests and FastAPI integration tests
pytest ml/tests backend/tests -v
```

### Step 4: Start Backend Server
```bash
# From backend directory:
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be accessible at: `http://127.0.0.1:8000/docs`

### Step 5: Start Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173/`

---

## 4. Example API Usage

### Match Outcome Prediction
`POST /api/predict`

**Request Body:**
```json
{
  "home_team": "Arsenal",
  "away_team": "Chelsea",
  "is_hypothetical": true
}
```

**Response (HTTP 200):**
```json
{
  "prediction_id": "pred_Ars_Che_20261027170831",
  "timestamp": "2026-10-27T11:38:31.981881Z",
  "competition": "Premier League",
  "home_team": "Arsenal",
  "away_team": "Chelsea",
  "scheduled_date": "2025-05-26",
  "is_hypothetical": true,
  "probabilities": {
    "home_win": { "code": "H", "label": "Home Win", "probability": 44.0, "raw": 0.4402 },
    "draw": { "code": "D", "label": "Draw", "probability": 29.5, "raw": 0.2952 },
    "away_win": { "code": "A", "label": "Away Win", "probability": 26.5, "raw": 0.2646 }
  },
  "most_likely_outcome": {
    "code": "H",
    "label": "Home Win",
    "probability": 44.0
  },
  "key_statistics": {
    "home_points_last_5": 11.0,
    "away_points_last_5": 8.0,
    "home_form": ["W", "W", "D", "W", "D"],
    "away_form": ["W", "L", "W", "D", "W"],
    "home_team_home_ppg": 2.2,
    "away_team_away_ppg": 1.4,
    "rest_advantage_days": 0.0,
    "h2h_summary": { "home_wins": 2, "draws": 1, "away_wins": 0 }
  },
  "model_version": "PITCHIQ Random Forest Match Predictor",
  "model_training_period": "2021-09-11 to 2024-09-28",
  "confidence_note": "Probabilistic estimate based strictly on pre-match historical team form and schedule dynamics. Football match outcomes carry inherent variance."
}
```

---

## 5. Academic Defense & Viva Resources

For detailed preparation on viva exam defense questions (supervised classification theory, data leakage proofs, chronological split justification, macro F1 vs accuracy, and domain limitations), consult:
👉 **[docs/VIVA_PREPARATION_GUIDE.md](docs/VIVA_PREPARATION_GUIDE.md)**

---

## 6. Project Disclaimer
*PITCHIQ is an academic machine learning research experiment developed for educational purposes. It is not a sports betting platform, commercial tipping service, or financial advisory tool. Model probabilities reflect historical statistical tendencies and do not guarantee future match outcomes.*
