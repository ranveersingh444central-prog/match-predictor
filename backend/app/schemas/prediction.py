"""
Pydantic Request & Response Schemas for PITCHIQ
Ensures typed, validated inputs and consistent API response contracts.
"""

from typing import Optional, Any
from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    home_team: str = Field(..., description="Home team name, e.g. 'Arsenal'")
    away_team: str = Field(..., description="Away team name, e.g. 'Chelsea'")
    match_date: Optional[str] = Field(None, description="Kickoff or reference date in YYYY-MM-DD")
    fixture_id: Optional[str] = Field(None, description="Optional fixture identifier")
    is_hypothetical: bool = Field(False, description="True if hypothetical matchup rather than scheduled fixture")

class OutcomeProbability(BaseModel):
    code: str
    label: str
    probability: float
    raw: float

class MostLikelyOutcome(BaseModel):
    code: str
    label: str
    probability: float

class PredictionResponse(BaseModel):
    prediction_id: str
    timestamp: str
    competition: str
    home_team: str
    away_team: str
    scheduled_date: str
    is_hypothetical: bool
    probabilities: dict[str, OutcomeProbability]
    most_likely_outcome: MostLikelyOutcome
    key_statistics: dict[str, Any]
    model_version: str
    model_training_period: str
    confidence_note: str

class TeamSummary(BaseModel):
    name: str
    matches_played: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_diff: int
    points: int
    ppg: float
    win_rate: float
    home_record: dict[str, Any]
    away_record: dict[str, Any]
    recent_form: list[str]
    recent_matches: list[dict[str, Any]]

class FixtureItem(BaseModel):
    fixture_id: str
    competition: str
    division: str
    date: str
    time: str
    home_team: str
    away_team: str
    status: str
    odds_context: Optional[dict[str, Any]] = None

class FixturesResponse(BaseModel):
    count: int
    source: str
    last_updated: str
    competition: str
    fixtures: list[FixtureItem]

class DataSummaryResponse(BaseModel):
    dataset_name: str
    competition: str
    total_valid_matches: int
    date_range_start: str
    date_range_end: str
    total_teams: int
    teams: list[str]
    outcome_distribution: dict[str, Any]
    seasons_covered: list[str]
    average_goals_per_match: float
    home_goals_avg: float
    away_goals_avg: float
