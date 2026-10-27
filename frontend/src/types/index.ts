export interface OutcomeProbability {
  code: 'H' | 'D' | 'A';
  label: string;
  probability: number;
  raw: number;
}

export interface PredictionResult {
  prediction_id: string;
  timestamp: string;
  competition: string;
  home_team: string;
  away_team: string;
  scheduled_date: string;
  is_hypothetical: boolean;
  probabilities: {
    home_win: OutcomeProbability;
    draw: OutcomeProbability;
    away_win: OutcomeProbability;
  };
  most_likely_outcome: {
    code: 'H' | 'D' | 'A';
    label: string;
    probability: number;
  };
  key_statistics: {
    home_points_last_5: number;
    away_points_last_5: number;
    home_form: ('W' | 'D' | 'L')[];
    away_form: ('W' | 'D' | 'L')[];
    home_goals_scored_last_5: number;
    away_goals_scored_last_5: number;
    home_goals_conceded_last_5: number;
    away_goals_conceded_last_5: number;
    home_team_home_ppg: number;
    away_team_away_ppg: number;
    rest_advantage_days: number;
    h2h_summary: {
      home_wins: number;
      draws: number;
      away_wins: number;
    };
  };
  model_version: string;
  model_training_period: string;
  confidence_note: string;
}

export interface TeamSummary {
  name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  ppg: number;
  win_rate: number;
}

export interface TeamMatchHistoryItem {
  date: string;
  opponent: string;
  is_home: boolean;
  venue: string;
  team_goals: number;
  opp_goals: number;
  score: string;
  result: 'W' | 'D' | 'L';
  season: string;
}

export interface TeamAnalysis {
  name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  ppg: number;
  win_rate: number;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  home_record: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    win_rate: number;
    ppg: number;
  };
  away_record: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    win_rate: number;
    ppg: number;
  };
  recent_form: ('W' | 'D' | 'L')[];
  recent_matches: TeamMatchHistoryItem[];
}

export interface FixtureItem {
  fixture_id: string;
  competition: string;
  division: string;
  date: string;
  time: string;
  home_team: string;
  away_team: string;
  status: string;
  odds_context?: {
    b365_h?: string;
    b365_d?: string;
    b365_a?: string;
  };
}

export interface MatchRecord {
  date: string;
  season: string;
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
  result: 'H' | 'D' | 'A';
  score: string;
  shots: string;
  shots_target: string;
}

export interface MatchesResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  matches: MatchRecord[];
}

export interface ModelMetrics {
  metadata: {
    model_name: string;
    algorithm: string;
    total_dataset_samples: number;
    train_samples: number;
    test_samples: number;
    training_period: string;
    test_period: string;
    features: string[];
  };
  baseline: {
    strategy: string;
    accuracy: number;
    macro_f1: number;
  };
  main_model: {
    accuracy: number;
    macro_precision: number;
    macro_recall: number;
    macro_f1: number;
    log_loss: number;
    brier_score: number;
    evaluated_test_matches: number;
    per_class: {
      H: { name: string; precision: number; recall: number; f1_score: number; support: number };
      D: { name: string; precision: number; recall: number; f1_score: number; support: number };
      A: { name: string; precision: number; recall: number; f1_score: number; support: number };
    };
  };
  confusion_matrix: {
    labels: string[];
    label_names: string[];
    matrix: number[][];
  };
  top_features: { feature: string; importance: number }[];
}

export interface DataSummary {
  dataset_name: string;
  competition: string;
  total_valid_matches: number;
  date_range_start: string;
  date_range_end: string;
  total_teams: number;
  teams: string[];
  outcome_distribution: {
    [key: string]: { count: number; pct: number } | number;
  };
  seasons_covered: string[];
  average_goals_per_match?: number;
  home_goals_avg?: number;
  away_goals_avg?: number;
}
