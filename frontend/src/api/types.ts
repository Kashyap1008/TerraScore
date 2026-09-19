export interface ScoreResponse {
  h3: string; 
  score: number; 
  grade: string;
  factors: { key: string; label: string; raw: number; weight: number; contribution: number; explanation: string }[];
  flags: { type: string; severity: string; text: string }[];
  archetype: string;
}
export type PresetName = 'retail' | 'warehouse' | 'ev';
export interface LayerMeta { id: string; name: string; type: string; url: string; default_opacity: number; default_visible: boolean }
