"""
Pydantic Request & Response Schemas for PITCHIQ UFC / MMA Analytics
Ensures typed, validated inputs and clear, transparent API contracts.
"""

from typing import Optional, Any
from pydantic import BaseModel, Field

class UFCPredictRequest(BaseModel):
    fighter_a: str = Field(..., description="Fighter A full name, e.g. 'Jon Jones'", min_length=2)
    fighter_b: str = Field(..., description="Fighter B full name, e.g. 'Daniel Cormier'", min_length=2)
    corner_a: Optional[str] = Field("Red", description="Corner assigned to Fighter A ('Red' or 'Blue')")
    corner_b: Optional[str] = Field("Blue", description="Corner assigned to Fighter B ('Red' or 'Blue')")
    target_date: Optional[str] = Field(None, description="Reference date in YYYY-MM-DD for pre-fight statistics calculation")
    is_title_bout: bool = Field(False, description="True if championship title bout (5 scheduled rounds)")
    is_hypothetical: bool = Field(True, description="True if simulated matchup rather than an official historical bout")

class UFCFighterProb(BaseModel):
    name: str
    corner: str
    probability: float
    probability_percent: str
    fair_decimal_odds: float

class UFCTaleOfTheTapeItem(BaseModel):
    name: str
    height_inches: Optional[float] = None
    height_cm: Optional[float] = None
    reach_inches: Optional[float] = None
    reach_cm: Optional[float] = None
    weight_lbs: Optional[float] = None
    stance: Optional[str] = None
    prior_ufc_fights: int = 0
    prior_ufc_wins: int = 0
    slpm: float = 0.0
    sapm: float = 0.0
    strike_acc_pct: float = 0.0
    strike_def_pct: float = 0.0
    takedown_avg_15m: float = 0.0
    takedown_def_pct: float = 0.0

class UFCPredictionResponse(BaseModel):
    prediction_id: str
    timestamp: str
    sport: str = "ufc_mma"
    model_version: str
    predicted_winner: str
    confidence_level: str
    probabilities: dict[str, UFCFighterProb]
    probabilities_sum_check: float
    method_probabilities: dict[str, float]
    tale_of_the_tape: dict[str, UFCTaleOfTheTapeItem]
    data_quality: dict[str, Any]
    influential_factors: list[dict[str, Any]]
    disclaimer: str

class UFCFighterSummary(BaseModel):
    fighter_name: str
    height: Optional[str] = None
    weight: Optional[str] = None
    reach: Optional[str] = None
    stance: Optional[str] = None
    dob: Optional[str] = None
    total_ufc_bouts: int = 0
    ufc_wins: int = 0
    slpm: float = 0.0
    str_acc: float = 0.0
    sapm: float = 0.0
    str_def: float = 0.0
    td_avg: float = 0.0
    td_def: float = 0.0
    sub_avg: float = 0.0

class UFCFightersResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    fighters: list[UFCFighterSummary]

class UFCFighterDetail(BaseModel):
    fighter_name: str
    height: Optional[str] = None
    height_cm: Optional[float] = None
    weight: Optional[str] = None
    weight_lbs: Optional[float] = None
    reach: Optional[str] = None
    reach_cm: Optional[float] = None
    stance: Optional[str] = None
    dob: Optional[str] = None
    total_ufc_bouts: int
    ufc_wins: int
    ufc_losses: int
    win_rate_pct: float
    slpm: float
    str_acc_pct: float
    sapm: float
    str_def_pct: float
    td_avg_15m: float
    td_def_pct: float
    sub_avg_15m: float
    recent_fights: list[dict[str, Any]]

class UFCFightItem(BaseModel):
    date: str
    red_fighter: str
    blue_fighter: str
    winner: Optional[str] = None
    winner_corner: Optional[str] = None
    method: str
    last_round: int
    last_round_time: str
    format: str
    weight_class: str
    title_bout: bool

class UFCFightsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    fights: list[UFCFightItem]

class UFCStatusResponse(BaseModel):
    status: str
    sport: str = "ufc_mma"
    model_loaded: bool
    champion_algorithm: str
    model_version: str
    data_ready: bool
    dataset_period: list[str]
    total_bouts: int
    total_athletes: int
    dataset_cutoff: str
    disclaimer: str

class UFCWeightClass(BaseModel):
    name: str
    total_bouts: int
    championship_bouts: int
