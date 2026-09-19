import { create } from 'zustand';

export interface AppState {
  preset: 'retail' | 'warehouse' | 'ev';
  activeLayers: string[];
  selectedSite: { lat: number; lon: number } | null;
  compareList: { lat: number; lon: number }[];
  setPreset: (p: AppState['preset']) => void;
  toggleLayer: (id: string) => void;
  setSelectedSite: (s: AppState['selectedSite']) => void;
  addToCompare: (s: { lat: number; lon: number }) => void;
  removeFromCompare: (i: number) => void;
  clearCompare: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  preset: 'retail',
  activeLayers: ['h3_grid', 'roads'],
  selectedSite: null,
  compareList: [],
  setPreset: (preset) => set({ preset }),
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
  clearCompare: () => set({ compareList: [] })
}));
