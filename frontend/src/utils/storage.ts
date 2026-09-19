export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  avatarUrl?: string;
  defaultPreset: 'retail' | 'warehouse' | 'ev';
  targetMetro: string;
}

export type SiteStatus = 'prospect' | 'under_review' | 'shortlisted' | 'approved' | 'rejected';

export interface SavedSite {
  id: string;
  h3: string;
  name: string;
  submarket: string;
  coordsFormatted: string;
  lat: number;
  lon: number;
  score: number;
  grade: string;
  preset: string;
  collectionId: string;
  status: SiteStatus;
  notes?: string;
  estimatedSqFt?: number;
  askingRent?: number;
  createdAt: string;
  factors?: { key: string; label: string; raw: number; contribution: number }[];
}

export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

export interface SavedComparison {
  id: string;
  title: string;
  preset: string;
  siteIds: string[];
  sites: { lat: number; lon: number; name: string; score: number }[];
  createdAt: string;
  notes?: string;
}

const STORAGE_KEYS = {
  USER: 'terrascorer_user',
  COLLECTIONS: 'terrascorer_collections',
  SAVED_SITES: 'terrascorer_saved_sites',
  SAVED_COMPARISONS: 'terrascorer_saved_comparisons',
};

export const DEFAULT_COLLECTIONS: CollectionFolder[] = [
  { id: 'all', name: 'All Saved Sites', description: 'General collection of bookmarked locations', color: '#10B981', createdAt: new Date().toISOString() },
  { id: 'q3_expansion', name: 'Austin Q3 Expansion', description: 'Top tier urban core retail prospects', color: '#06B6D4', createdAt: new Date().toISOString() },
  { id: 'flagship_hub', name: 'Flagship Store Candidates', description: 'High-visibility anchor locations', color: '#F59E0B', createdAt: new Date().toISOString() },
  { id: 'logistics_ev', name: 'EV & Logistics Corridors', description: 'Highway accessible depot sites', color: '#8B5CF6', createdAt: new Date().toISOString() },
];

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user_1',
    name: 'Sarah Chen',
    email: 'sarah.chen@apexretail.io',
    role: 'Director of Real Estate & Expansion',
    organization: 'Apex Retail Capital',
    defaultPreset: 'retail',
    targetMetro: 'Austin, TX',
  },
  {
    id: 'user_2',
    name: 'Marcus Vance',
    email: 'm.vance@nexusev.com',
    role: 'Infrastructure Strategy Lead',
    organization: 'Nexus EV Network',
    defaultPreset: 'ev',
    targetMetro: 'Austin, TX',
  },
  {
    id: 'user_3',
    name: 'Elena Rostova',
    email: 'elena@logispeed.com',
    role: 'Senior Site Selection Analyst',
    organization: 'LogiSpeed Fulfillment',
    defaultPreset: 'warehouse',
    targetMetro: 'Austin, TX',
  },
];

export function loadUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEMO_USERS[0];
}

export function saveUser(user: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {}
}

export function loadCollections(): CollectionFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_COLLECTIONS;
}

export function saveCollections(collections: CollectionFolder[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  } catch {}
}

export function loadSavedSites(): SavedSite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_SITES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 'site_init_1',
      h3: '88489e2223fffff',
      name: 'South Congress / SoCo',
      submarket: 'Commercial & Retail',
      coordsFormatted: '30.245° N, 97.751° W',
      lat: 30.245,
      lon: -97.751,
      score: 84,
      grade: 'A',
      preset: 'retail',
      collectionId: 'q3_expansion',
      status: 'shortlisted',
      notes: 'High footfall corridor with massive weekend density. Direct bus stop outside plot.',
      estimatedSqFt: 3500,
      askingRent: 68,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'site_init_2',
      h3: '88489e2749fffff',
      name: 'The Domain / North Tech Hub',
      submarket: 'North Tech Corridor',
      coordsFormatted: '30.402° N, 97.725° W',
      lat: 30.402,
      lon: -97.725,
      score: 91,
      grade: 'A+',
      preset: 'retail',
      collectionId: 'flagship_hub',
      status: 'approved',
      notes: 'Premier tech worker demographic, median income > $115k. Excellent anchor adjacency.',
      estimatedSqFt: 5200,
      askingRent: 82,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'site_init_3',
      h3: '88489e32b1fffff',
      name: 'Airport Hub (ABIA / Cargo)',
      submarket: 'ABIA Logistics Zone',
      coordsFormatted: '30.200° N, 97.670° W',
      lat: 30.200,
      lon: -97.670,
      score: 79,
      grade: 'B+',
      preset: 'ev',
      collectionId: 'logistics_ev',
      status: 'under_review',
      notes: 'Heavy traffic volume off SH-71. 3-phase grid capacity verified with Austin Energy.',
      estimatedSqFt: 12000,
      askingRent: 35,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ];
}

export function saveSavedSites(sites: SavedSite[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_SITES, JSON.stringify(sites));
  } catch {}
}

export function loadSavedComparisons(): SavedComparison[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_COMPARISONS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveSavedComparisons(comparisons: SavedComparison[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_COMPARISONS, JSON.stringify(comparisons));
  } catch {}
}
