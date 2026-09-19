import { create } from 'zustand';

export const WEIGHTS_BY_PRESET = {
  retail: { demand: 0.30, accessibility: 0.15, competition: 0.20, complementarity: 0.20, landuse: 0.10, risk: 0.05 },
  warehouse: { demand: 0.05, accessibility: 0.45, competition: 0.05, complementarity: 0.05, landuse: 0.25, risk: 0.15 },
  ev: { demand: 0.25, accessibility: 0.30, competition: 0.25, complementarity: 0.05, landuse: 0.10, risk: 0.05 }
};

export interface AppState {
  preset: 'retail' | 'warehouse' | 'ev';
  activeLayers: string[];
  selectedSite: { lat: number; lon: number } | null;
  compareList: { lat: number; lon: number }[];
  weights: Record<string, number>;
  layerOpacity: Record<string, number>;
  drawnPolygon: GeoJSON.Polygon | null;
  setPreset: (p: AppState['preset']) => void;
  toggleLayer: (id: string) => void;
  setSelectedSite: (s: AppState['selectedSite']) => void;
  addToCompare: (s: { lat: number; lon: number }) => void;
  removeFromCompare: (i: number) => void;
  clearCompare: () => void;
  setWeight: (key: string, value: number) => void;
  resetWeights: () => void;
  setLayerOpacity: (id: string, value: number) => void;
  setDrawnPolygon: (p: GeoJSON.Polygon | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  preset: 'retail',
  activeLayers: ['h3_grid', 'roads'],
  selectedSite: null,
  compareList: [],
  weights: WEIGHTS_BY_PRESET.retail,
  layerOpacity: { h3_grid: 0.75, roads: 0.6, flood_zones: 0.35, pois: 1.0, transit_stops: 1.0 },
  drawnPolygon: null,
  setPreset: (preset) => set({ preset, weights: WEIGHTS_BY_PRESET[preset] }),
  toggleLayer: (id) => set((state) => ({
    activeLayers: state.activeLayers.includes(id) 
      ? state.activeLayers.filter(l => l !== id)
      : [...state.activeLayers, id]
  })),
  setSelectedSite: (site) => set({ selectedSite: site }),
  addToCompare: (site) => set((state) => {
    if (state.compareList.length >= 3) return state;
    return { compareList: [...state.compareList, site] };
  }),
  removeFromCompare: (index) => set((state) => ({
    compareList: state.compareList.filter((_, i) => i !== index)
  })),
  clearCompare: () => set({ compareList: [] }),
  setWeight: (key, value) => set((state) => ({
    weights: { ...state.weights, [key]: value }
  })),
  resetWeights: () => set((state) => ({
    weights: WEIGHTS_BY_PRESET[state.preset]
  })),
  setLayerOpacity: (id, value) => set((state) => ({
    layerOpacity: { ...state.layerOpacity, [id]: value }
  })),
  setDrawnPolygon: (p) => set({ drawnPolygon: p })
}));
