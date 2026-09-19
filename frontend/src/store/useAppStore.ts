import { create } from 'zustand';
import {
  type UserProfile,
  type SavedSite,
  type CollectionFolder,
  type SavedComparison,
  loadUser,
  saveUser,
  loadCollections,
  saveCollections,
  loadSavedSites,
  saveSavedSites,
  loadSavedComparisons,
  saveSavedComparisons,
} from '../utils/storage';

export const WEIGHTS_BY_PRESET = {
  retail: { demand: 0.30, accessibility: 0.15, competition: 0.20, complementarity: 0.20, landuse: 0.10, risk: 0.05 },
  warehouse: { demand: 0.05, accessibility: 0.45, competition: 0.05, complementarity: 0.05, landuse: 0.25, risk: 0.15 },
  ev: { demand: 0.25, accessibility: 0.30, competition: 0.25, complementarity: 0.05, landuse: 0.10, risk: 0.05 }
};

export type AppView = 'explorer' | 'requirements' | 'collections' | 'compare' | 'methodology';

export interface AppState {
  // Navigation & Landing Page State
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  showLandingPage: boolean;
  setShowLandingPage: (show: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  logout: () => void;

  // Preset & Map Explorer State
  preset: 'retail' | 'warehouse' | 'ev';
  activeLayers: string[];
  selectedSite: { lat: number; lon: number } | null;
  compareList: { lat: number; lon: number }[];
  weights: Record<string, number>;
  layerOpacity: Record<string, number>;
  drawnPolygon: GeoJSON.Polygon | null;
  isochroneData: { polygons: Record<string, GeoJSON.Polygon>; population_reachable: Record<string, number> } | null;
  flyTo: { lat: number; lon: number; zoom?: number } | null;

  // Enterprise User & Collections State
  currentUser: UserProfile;
  collections: CollectionFolder[];
  savedSites: SavedSite[];
  savedComparisons: SavedComparison[];
  bookmarkModalSite: { lat: number; lon: number; score?: number; h3?: string; grade?: string; preset?: string } | null;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;

  // Actions
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
  setIsochroneData: (data: AppState['isochroneData']) => void;
  setFlyTo: (f: AppState['flyTo']) => void;

  // Enterprise Actions
  setCurrentUser: (user: UserProfile) => void;
  addCollection: (name: string, description?: string, color?: string) => void;
  deleteCollection: (id: string) => void;
  saveSiteToCollection: (site: Omit<SavedSite, 'id' | 'createdAt'>) => void;
  removeSavedSite: (id: string) => void;
  updateSavedSite: (id: string, updates: Partial<SavedSite>) => void;
  saveComparisonDeck: (title: string, sites: { lat: number; lon: number; name: string; score: number }[], notes?: string) => void;
  deleteComparisonDeck: (id: string) => void;
  setBookmarkModalSite: (site: AppState['bookmarkModalSite']) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setIsProfileModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'explorer',
  setCurrentView: (view) => set({ currentView: view, showLandingPage: false }),
  showLandingPage: true, // Landing page is the initial entry point
  setShowLandingPage: (show) => set({ showLandingPage: show }),
  isOnboardingOpen: false,
  setIsOnboardingOpen: (open) => set({ isOnboardingOpen: open }),
  logout: () => set({ showLandingPage: true, currentView: 'explorer', selectedSite: null }),

  preset: 'retail',
  activeLayers: ['h3_grid', 'roads'],
  selectedSite: null,
  compareList: [],
  weights: WEIGHTS_BY_PRESET.retail,
  layerOpacity: { h3_grid: 0.50, roads: 0.6, flood_zones: 0.35, pois: 1.0, transit_stops: 1.0, hotspots: 1.0, isochrone: 1.0 },
  drawnPolygon: null,
  isochroneData: null,
  flyTo: null,

  currentUser: loadUser(),
  collections: loadCollections(),
  savedSites: loadSavedSites(),
  savedComparisons: loadSavedComparisons(),
  bookmarkModalSite: null,
  isAuthModalOpen: false,
  isProfileModalOpen: false,

  setPreset: (preset) => set({ preset, weights: WEIGHTS_BY_PRESET[preset] }),
  toggleLayer: (id) => set((state) => ({
    activeLayers: state.activeLayers.includes(id) 
      ? state.activeLayers.filter(l => l !== id)
      : [...state.activeLayers, id]
  })),
  setSelectedSite: (site) => set({ selectedSite: site }),
  addToCompare: (site) => set((state) => {
    if (state.compareList.length >= 4) return state;
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
  setDrawnPolygon: (p) => set({ drawnPolygon: p }),
  setIsochroneData: (data) => set({ isochroneData: data }),
  setFlyTo: (f) => set({ flyTo: f }),

  // User & Collections
  setCurrentUser: (user) => {
    saveUser(user);
    set({ currentUser: user });
  },
  addCollection: (name, description, color) => set((state) => {
    const newColl: CollectionFolder = {
      id: `coll_${Date.now()}`,
      name,
      description: description || '',
      color: color || '#10B981',
      createdAt: new Date().toISOString(),
    };
    const next = [...state.collections, newColl];
    saveCollections(next);
    return { collections: next };
  }),
  deleteCollection: (id) => set((state) => {
    if (id === 'all') return state;
    const next = state.collections.filter(c => c.id !== id);
    saveCollections(next);
    return { collections: next };
  }),
  saveSiteToCollection: (siteData) => set((state) => {
    const newSite: SavedSite = {
      ...siteData,
      id: `saved_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    // If site already exists in collection, update it; otherwise append
    const existingIdx = state.savedSites.findIndex(s => s.h3 === siteData.h3 && s.collectionId === siteData.collectionId);
    let next: SavedSite[];
    if (existingIdx >= 0) {
      next = [...state.savedSites];
      next[existingIdx] = { ...next[existingIdx], ...newSite };
    } else {
      next = [newSite, ...state.savedSites];
    }
    saveSavedSites(next);
    return { savedSites: next, bookmarkModalSite: null };
  }),
  removeSavedSite: (id) => set((state) => {
    const next = state.savedSites.filter(s => s.id !== id);
    saveSavedSites(next);
    return { savedSites: next };
  }),
  updateSavedSite: (id, updates) => set((state) => {
    const next = state.savedSites.map(s => s.id === id ? { ...s, ...updates } : s);
    saveSavedSites(next);
    return { savedSites: next };
  }),
  saveComparisonDeck: (title, sites, notes) => set((state) => {
    const newComp: SavedComparison = {
      id: `comp_${Date.now()}`,
      title,
      preset: state.preset,
      siteIds: sites.map(s => `${s.lat}_${s.lon}`),
      sites,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };
    const next = [newComp, ...state.savedComparisons];
    saveSavedComparisons(next);
    return { savedComparisons: next };
  }),
  deleteComparisonDeck: (id) => set((state) => {
    const next = state.savedComparisons.filter(c => c.id !== id);
    saveSavedComparisons(next);
    return { savedComparisons: next };
  }),
  setBookmarkModalSite: (site) => set({ bookmarkModalSite: site }),
  setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setIsProfileModalOpen: (open) => set({ isProfileModalOpen: open }),
}));
