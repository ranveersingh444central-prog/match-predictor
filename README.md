# PITCHIQ — Multi-Sport Outcome Prediction & Intelligence Platform

> **“Read the game differently.”**  
> *University Machine Learning Experiment 11 & Advanced Combat Analytics System*

PITCHIQ is a multi-sport forecasting and analytics intelligence platform providing predictive modeling for:
1. **English Premier League Football:** Causal rolling form, home/away venue dynamics, and 3-way outcome probability forecasting ($H$, $D$, $A$).
2. **Ultimate Fighting Championship (UFC / MMA):** Head-to-head combat prediction using pre-fight Tale-of-the-Tape physical metrics, historical striking volume, defensive absorption rates, grappling dynamics, and victory method categorization.

Both systems are engineered with **zero data leakage** safeguards, chronological time-horizon validation, and a botanical editorial user interface (deep obsidian, sage, ivory, warm gold).

---

## 1. System Architecture

```
pitchiq/
├── frontend/               # React 19 + TypeScript + Vite + Vanilla CSS
│   ├── src/
│   │   ├── components/     # TacticalPitch, TaleOfTheTape, Navigation, Footer
│   │   ├── pages/
│   │   │   ├── (Football)  # Overview, MatchPredictor, TeamAnalysis, ModelLab, DataExplorer, Methodology
│   │   │   └── ufc/        # UFCOverview, FightPredictor, FighterProfiles, FightExplorer, UFCModelLab, UFCMethodology
│   │   ├── services/       # footballApi.ts & ufcApi.ts
│   │   ├── types/          # football.ts & ufc.ts contracts
│   │   └── App.tsx         # Unified Sport Switcher & Tab State
├── backend/                # Python 3.10+ FastAPI Application
│   ├── app/
│   │   ├── api/            # Football (/api/*) & UFC (/api/ufc/*) endpoints
│   │   ├── core/           # Configuration & CORS settings
│   │   ├── schemas/        # Football & UFC Pydantic V2 schemas
│   │   ├── services/       # FootballService & UFCService
│   │   └── main.py         # Unified FastAPI application entry point
│   ├── tests/              # test_api.py (11 tests) & test_ufc_api.py (13 tests)
│   └── requirements.txt
├── ml/                     # Machine Learning Pipeline
│   ├── data/
│   │   ├── raw/ & processed/       # Premier League data (1,520 matches)
│   │   └── ufc/                    # UFC datasets (8,961 bouts, 4,629 fighters)
│   ├── src/
│   │   ├── (Football)              # data_loader, validation, features, train, predict
│   │   └── ufc/                    # ufc_data_loader, ufc_data_refresh, ufc_validation, ufc_features, ufc_train, ufc_predict
│   ├── artifacts/                  # Football & UFC trained models & calibrations
│   ├── reports/                    # Quality reports & feature documentation
│   └── tests/                      # test_ml_pipeline.py & test_ufc_pipeline.py (16 tests)
├── docs/
│   └── VIVA_PREPARATION_GUIDE.md   # Academic viva defense questions & answers
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

### UFC / MMA Combat Intelligence Pipeline & Results

#### Data Provenance & Scale
- **Source:** Official UFCStats.com combat statistics archive via open factual sports datasets
- **Historical Coverage:** March 11, 1994 to October 24, 2026 (8,961 bouts, 4,629 athlete profiles)
- **Leakage Safeguards:** Strictly backward-looking rolling form ($t < t_{\text{bout}}$), elimination of post-fight and career static totals, neutral debutant imputation.

#### Chronological Validation Split (3-Way)
- **Training Horizon:** 6,164 bouts (`1994-03-11` to `2021-09-25`)
- **Validation Horizon:** 1,320 bouts (`2021-09-25` to `2024-04-27`)
- **Held-Out Test Horizon:** 1,322 unseen bouts (`2024-04-27` to `2026-10-24`)

#### Empirical Results (Held-Out Test Set: 1,322 Bouts)

| Metric | Prior Class Baseline | Logistic Regression | Random Forest |
| :--- | :--- | :--- | :--- |
| **Accuracy** | 55.67% | **61.65% (+5.98%)** | 60.14% (+4.47%) |
| **ROC-AUC** | 0.5000 | 0.6651 | **0.6706** |
| **Log Loss** | 0.7153 | **0.6573** | 0.6602 |
| **Brier Score** | 0.2600 | **0.2320** | 0.2341 |
| **Victory Method Classifier** | - | **61.88% Accuracy** | (KO/TKO, Sub, Dec) |

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

#### Football Pipeline (Premier League)
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

#### UFC / MMA Combat Pipeline
```bash
# 1. Ingest historical archive (1994-2021) & refreshed dataset (2021-2026)
python ml/src/ufc/ufc_data_loader.py
python ml/src/ufc/ufc_data_refresh.py

# 2. Validate records & clean fighter profiles
python ml/src/ufc/ufc_validation.py

# 3. Engineer pre-fight differential features (leakage-safe)
python ml/src/ufc/ufc_features.py

# 4. Train multi-tier models, calibration curves & method classifier
python ml/src/ufc/ufc_train.py
```

### Step 3: Run Automated Tests
```bash
# Run all 40 tests across Football ML, UFC ML, and FastAPI backend
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
```

### UFC Bout Outcome & Method Prediction
`POST /api/ufc/predict`

**Request Body:**
```json
{
  "fighter_a": "Jon Jones",
  "fighter_b": "Daniel Cormier",
  "corner_a": "Red",
  "corner_b": "Blue",
  "is_title_bout": true
}
```

**Response (HTTP 200):**
```json
{
  "prediction_id": "ufc_Jon_Jones_vs_Daniel_Cormier_20261028",
  "sport": "ufc_mma",
  "fighter_a": "Jon Jones",
  "fighter_b": "Daniel Cormier",
  "corner_a": "Red",
  "corner_b": "Blue",
  "is_title_bout": true,
  "probabilities": {
    "red_win": { "fighter": "Jon Jones", "corner": "Red", "probability": 72.4 },
    "blue_win": { "fighter": "Daniel Cormier", "corner": "Blue", "probability": 27.6 }
  },
  "predicted_winner": {
    "fighter": "Jon Jones",
    "corner": "Red",
    "confidence": "High",
    "win_probability": 72.4
  },
  "method_probabilities": {
    "Decision": 58.2,
    "KO/TKO": 26.5,
    "Submission": 15.3
  },
  "tale_of_the_tape": {
    "height_diff": 5.0,
    "reach_diff": 12.0,
    "slpm_diff": 0.45,
    "sapm_diff": -0.88,
    "td_def_diff": 0.17
  },
  "leakage_safeguards_verified": true
}
```

---

## 5. Academic Defense & Viva Resources

For detailed preparation on viva exam defense questions (supervised classification theory, data leakage proofs, chronological split justification, macro F1 vs accuracy, and domain limitations), consult:
👉 **[docs/VIVA_PREPARATION_GUIDE.md](docs/VIVA_PREPARATION_GUIDE.md)**

---

## 6. Project Disclaimer
*PITCHIQ is an academic machine learning research experiment developed for educational purposes. It is not a sports betting platform, commercial tipping service, or financial advisory tool. Model probabilities reflect historical statistical tendencies and do not guarantee future match outcomes.*
