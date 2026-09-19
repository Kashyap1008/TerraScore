import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchScore } from '../api/client';
import type { ScoreResponse } from '../api/types';

export default function SiteScoreCard() {
  const { selectedSite, preset } = useAppStore();
  const [scoreData, setScoreData] = useState<ScoreResponse | null>(null);

  useEffect(() => {
    if (selectedSite) {
      fetchScore(selectedSite.lat, selectedSite.lon, preset).then((data) => {
        setScoreData(data);
      });
    } else {
      setScoreData(null);
    }
  }, [selectedSite, preset]);

  if (!selectedSite || !scoreData) return null;

  return (
    <div className="absolute top-20 right-4 w-96 z-20">
      <div className="bg-panel/85 backdrop-blur border border-panelEdge rounded-sm shadow-neon-green p-6 relative">
        <div className="absolute -top-3 left-4 bg-neonGreen text-black font-mono text-[10px] px-2 py-0.5">
          // SITE_ANALYSIS
        </div>
        
        <div className="flex items-baseline gap-4 mb-6">
          <h1 className="font-sans font-bold text-6xl text-neonGreen tracking-tighter">
            {scoreData.score}
          </h1>
          <span className="font-mono text-textMuted text-xl">/ 100</span>
          <span className="ml-auto border border-neonGreen text-neonGreen font-mono px-2 py-0.5 rounded-sm">
            {scoreData.grade}
          </span>
        </div>

        <div className="space-y-4">
          {scoreData.factors.map((f) => {
            const width = Math.min(100, Math.max(0, f.raw * 100));
            const barColor = f.raw >= 0.7 ? 'bg-neonGreen' : f.raw >= 0.4 ? 'bg-neonCyan' : 'bg-neonMagenta';
            
            return (
              <div key={f.key} className="flex items-center gap-3" title={f.explanation}>
                <span className="font-mono text-textMuted text-xs uppercase w-24 truncate">{f.label}</span>
                <div className="bg-panelEdge h-1 flex-1 relative">
                  <div className={`absolute top-0 left-0 h-1 ${barColor}`} style={{ width: `${width}%` }} />
                </div>
                <span className="font-mono text-white text-xs w-8 text-right">{f.raw}</span>
              </div>
            );
          })}
        </div>

        {scoreData.flags.length > 0 && (
          <div className="mt-6 border-t border-panelEdge pt-4 space-y-2">
            {scoreData.flags.map((flag, idx) => (
              <div key={idx} className="flex gap-2 font-mono text-xs text-neonMagenta">
                <span>[!]</span>
                <span>{flag.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
