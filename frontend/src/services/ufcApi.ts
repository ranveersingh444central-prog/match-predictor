/**
 * UFC / MMA API Client for PITCHIQ
 * Interacts with FastAPI backend routes mounted under /api/ufc
 */

import {
  UFCStatusResponse,
  UFCFightersResponse,
  UFCFighterDetail,
  UFCFightsResponse,
  UFCWeightClass,
  UFCPredictRequest,
  UFCPredictionResponse,
  UFCModelMetricsResponse,
  UFCCalibrationBin,
  UFCFeatureImportanceItem
} from '../types/ufc';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const UFC_BASE = `${API_BASE}/ufc`;

async function fetchUfcJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${UFC_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  if (!response.ok) {
    let errorDetail = `UFC Service request failed (${response.status})`;
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

export const ufcApi = {
  getStatus: () => fetchUfcJson<UFCStatusResponse>('/status'),
  getMeta: () => fetchUfcJson<any>('/meta'),
  getModelMetrics: () => fetchUfcJson<UFCModelMetricsResponse>('/model/metrics'),
  getFeatureImportance: () => fetchUfcJson<UFCFeatureImportanceItem[]>('/model/feature-importance'),
  getCalibration: () => fetchUfcJson<UFCCalibrationBin[]>('/model/calibration'),
  
  getFighters: (params: { search?: string; stance?: string; page?: number; page_size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.stance) q.set('stance', params.stance);
    if (params.page) q.set('page', params.page.toString());
    if (params.page_size) q.set('page_size', params.page_size.toString());
    return fetchUfcJson<UFCFightersResponse>(`/fighters?${q.toString()}`);
  },

  getFighterDetail: (fighterName: string) => {
    return fetchUfcJson<UFCFighterDetail>(`/fighters/${encodeURIComponent(fighterName)}`);
  },

  getFights: (params: { fighter?: string; weight_class?: string; method?: string; page?: number; page_size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.fighter) q.set('fighter', params.fighter);
    if (params.weight_class) q.set('weight_class', params.weight_class);
    if (params.method) q.set('method', params.method);
    if (params.page) q.set('page', params.page.toString());
    if (params.page_size) q.set('page_size', params.page_size.toString());
    return fetchUfcJson<UFCFightsResponse>(`/fights?${q.toString()}`);
  },

  getWeightClasses: () => fetchUfcJson<UFCWeightClass[]>('/weight-classes'),

  predictMatchup: (payload: UFCPredictRequest) => {
    return fetchUfcJson<UFCPredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
