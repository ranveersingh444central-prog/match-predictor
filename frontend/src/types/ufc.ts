/**
 * TypeScript Type Definitions for PITCHIQ UFC / MMA Analytics & Prediction Subsystem
 * Perfectly matches backend Pydantic models in backend/app/schemas/ufc_schemas.py
 */

export interface UFCFighterProb {
  name: string;
  corner: 'Red' | 'Blue' | string;
  probability: number;
  probability_percent: string;
  fair_decimal_odds: number;
}

export interface UFCTaleOfTheTapeItem {
  name: string;
  height_inches: number | null;
  height_cm: number | null;
  reach_inches: number | null;
  reach_cm: number | null;
  weight_lbs: number | null;
  stance: string | null;
  prior_ufc_fights: number;
  prior_ufc_wins: number;
  slpm: number;
  sapm: number;
  strike_acc_pct: number;
  strike_def_pct: number;
  takedown_avg_15m: number;
  takedown_def_pct: number;
}

export interface InfluentialFactor {
  factor: string;
  advantage_fighter: string;
  differential: string;
}

export interface UFCDataQuality {
  status: string;
  score: number;
  evaluation_date: string;
  reach_recorded: boolean;
  is_title_bout: boolean;
}

export interface UFCPredictionResponse {
  prediction_id: string;
  timestamp: string;
  sport: string;
  model_version: string;
  predicted_winner: string;
  confidence_level: string;
  probabilities: {
    fighter_a: UFCFighterProb;
    fighter_b: UFCFighterProb;
  };
  probabilities_sum_check: number;
  method_probabilities: {
    Decision?: number;
    'KO/TKO'?: number;
    Submission?: number;
    [key: string]: number | undefined;
  };
  tale_of_the_tape: {
    fighter_a: UFCTaleOfTheTapeItem;
    fighter_b: UFCTaleOfTheTapeItem;
  };
  data_quality: UFCDataQuality;
  influential_factors: InfluentialFactor[];
  disclaimer: string;
}

export interface UFCPredictRequest {
  fighter_a: string;
  fighter_b: string;
  corner_a?: string;
  corner_b?: string;
  target_date?: string;
  is_title_bout?: boolean;
  is_hypothetical?: boolean;
}

export interface UFCFighterSummary {
  fighter_name: string;
  height: string | null;
  weight: string | null;
  reach: string | null;
  stance: string | null;
  dob: string | null;
  total_ufc_bouts: number;
  ufc_wins: number;
  slpm: number;
  str_acc: number;
  sapm: number;
  str_def: number;
  td_avg: number;
  td_def: number;
  sub_avg: number;
}

export interface UFCFightersResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  fighters: UFCFighterSummary[];
}

export interface UFCFightLogItem {
  date: string;
  opponent: string;
  corner: 'Red' | 'Blue';
  outcome: 'W' | 'L' | 'D/NC';
  method: string;
  round: number;
  time: string;
  weight_class: string;
  title_bout: boolean;
}

export interface UFCFighterDetail {
  fighter_name: string;
  height: string | null;
  height_cm: number | null;
  weight: string | null;
  weight_lbs: number | null;
  reach: string | null;
  reach_cm: number | null;
  stance: string | null;
  dob: string | null;
  total_ufc_bouts: number;
  ufc_wins: number;
  ufc_losses: number;
  win_rate_pct: number;
  slpm: number;
  str_acc_pct: number;
  sapm: number;
  str_def_pct: number;
  td_avg_15m: number;
  td_def_pct: number;
  sub_avg_15m: number;
  recent_fights: UFCFightLogItem[];
}

export interface UFCFightItem {
  date: string;
  red_fighter: string;
  blue_fighter: string;
  winner: string;
  winner_corner: 'Red' | 'Blue' | null;
  method: string;
  last_round: number;
  last_round_time: string;
  format: string;
  weight_class: string;
  title_bout: boolean;
}

export interface UFCFightsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  fights: UFCFightItem[];
}

export interface UFCStatusResponse {
  status: string;
  sport: string;
  model_loaded: boolean;
  champion_algorithm: string;
  model_version: string;
  data_ready: boolean;
  dataset_period: [string, string];
  total_bouts: number;
  total_athletes: number;
  dataset_cutoff: string;
  disclaimer: string;
}

export interface UFCWeightClass {
  name: string;
  total_bouts: number;
  championship_bouts: number;
}

export interface UFCModelEvaluation {
  model_name: string;
  accuracy: number;
  roc_auc: number;
  log_loss: number | null;
  brier_score: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
}

export interface UFCModelMetricsResponse {
  timestamp: string;
  champion_model: string;
  dataset_split: {
    strategy: string;
    train_samples: number;
    train_date_range: [string, string];
    val_samples: number;
    val_date_range: [string, string];
    test_samples: number;
    test_date_range: [string, string];
    test_class_balance: {
      red_wins: number;
      blue_wins: number;
      red_win_rate_pct: number;
    };
  };
  models_evaluated: {
    baseline_prior: UFCModelEvaluation;
    baseline_red_always: UFCModelEvaluation;
    logistic_regression: UFCModelEvaluation;
    random_forest: UFCModelEvaluation;
  };
  champion_performance: UFCModelEvaluation;
  confusion_matrix: {
    labels: string[];
    matrix: number[][];
  };
  secondary_method_model?: {
    task: string;
    accuracy: number;
    total_test_samples: number;
    class_balance_test: Record<string, number>;
  };
}

export interface UFCCalibrationBin {
  predicted_probability_mid: number;
  actual_win_rate: number;
}

export interface UFCFeatureImportanceItem {
  feature: string;
  weight: number;
  importance: number;
}
