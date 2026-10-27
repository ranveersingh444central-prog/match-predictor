import {
  PredictionResult,
  TeamSummary,
  TeamAnalysis,
  FixtureItem,
  MatchesResponse,
  ModelMetrics,
  DataSummary
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  getHealth: () => fetchJson<{ status: string; model_loaded: boolean; data_ready: boolean }>('/health'),
  getMeta: () => fetchJson<any>('/meta'),
  getTeams: () => fetchJson<{ count: number; teams: TeamSummary[] }>('/teams'),
  getTeamAnalysis: (teamName: string) => fetchJson<TeamAnalysis>(`/teams/${encodeURIComponent(teamName)}/analysis`),
  getMatches: (params: { team?: string; season?: string; result?: string; page?: number; page_size?: number }) => {
    const q = new URLSearchParams();
    if (params.team) q.set('team', params.team);
    if (params.season) q.set('season', params.season);
    if (params.result) q.set('result', params.result);
    if (params.page) q.set('page', params.page.toString());
    if (params.page_size) q.set('page_size', params.page_size.toString());
    return fetchJson<MatchesResponse>(`/matches?${q.toString()}`);
  },
  getFixtures: () => fetchJson<{ count: number; source: string; last_updated: string; fixtures: FixtureItem[] }>('/fixtures'),
  predictMatch: (payload: { home_team: string; away_team: string; match_date?: string; fixture_id?: string; is_hypothetical?: boolean }) => {
    return fetchJson<PredictionResult>('/predict', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getPredictionHistory: () => fetchJson<{ count: number; history: PredictionResult[] }>('/predictions/history'),
  getModelMetrics: () => fetchJson<ModelMetrics>('/model/metrics'),
  getFeatureImportance: () => fetchJson<{ feature: string; importance: number }[]>('/model/feature-importance'),
  getConfusionMatrix: () => fetchJson<{ labels: string[]; label_names: string[]; matrix: number[][] }>('/model/confusion-matrix'),
  getDataSummary: () => fetchJson<DataSummary>('/data/summary'),
  refreshData: () => fetchJson<{ status: string; message: string; fixtures_count: number }>('/data/refresh', { method: 'POST' })
};
