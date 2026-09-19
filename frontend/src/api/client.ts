import type { ScoreResponse, PresetName, LayerMeta } from './types';
import { MOCK_SCORE_RESPONSE } from './mockData';

// Keep USE_MOCK = true until Megh confirms the endpoint is live
const USE_MOCK = false;

export async function fetchScore(lat: number, lon: number, preset: PresetName, weights?: Record<string, number>): Promise<ScoreResponse> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SCORE_RESPONSE), 200));
  }
  const res = await fetch('/api/v1/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, preset, weights })
  });
  return res.json();
}

export async function fetchBatch(polygon: GeoJSON.Polygon, preset: PresetName, limit: number = 500) {
  const res = await fetch('/api/v1/score/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ polygon, preset, limit })
  });
  return res.json();
}

export async function fetchIsochrone(lat: number, lon: number, minutes: number[] = [10, 20, 30], mode: string = 'driving') {
  const res = await fetch('/api/v1/isochrone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, minutes, mode })
  });
  return res.json();
}

export function reportUrl(h3: string, preset: PresetName): string {
  return `/api/v1/report/${h3}?preset=${preset}`;
}
