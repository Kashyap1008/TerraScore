import type { ScoreResponse, PresetName, LayerMeta } from './types';
import { MOCK_SCORE_RESPONSE } from './mockData';

// Keep USE_MOCK = true until Megh confirms the endpoint is live
const USE_MOCK = true;

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

export async function fetchLayers(): Promise<LayerMeta[]> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve([]), 200));
  }
  const res = await fetch('/api/v1/layers');
  return res.json();
}

export async function fetchHotspots(preset: PresetName, type: 'hot' | 'cold') {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({}), 200));
  }
  const res = await fetch(`/api/v1/hotspots?preset=${preset}&type=${type}`);
  return res.json();
}

export async function fetchIsochrone(lat: number, lon: number) {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({}), 200));
  }
  const res = await fetch('/api/v1/isochrone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon })
  });
  return res.json();
}
