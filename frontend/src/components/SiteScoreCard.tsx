import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchScore, fetchIsochrone, reportUrl } from '../api/client';
import type { ScoreResponse } from '../api/types';
import WeightSliders from './WeightSliders';

export default function SiteScoreCard() {
  const { selectedSite, preset, weights, setWeight, resetWeights, addToCompare, setIsochroneData, toggleLayer, activeLayers } = useAppStore();
  const [scoreData, setScoreData] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSite) {
      setLoading(true);
      const timer = setTimeout(() => {
        fetchScore(selectedSite.lat, selectedSite.lon, preset, weights).then(data => {
          setScoreData(data);
          setLoading(false);
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setScoreData(null);
    }
  }, [selectedSite, preset, weights]);

  if (!selectedSite || (!scoreData && !loading)) return (
    <div className="absolute top-20 right-4 w-96 z-20">
      <div className="bg-panel/85 backdrop-blur border border-panelEdge rounded-sm shadow-neon-green p-6 flex flex-col items-center justify-center h-32">
        <span className="font-mono text-textMuted text-xs uppercase">// CLICK A HEXAGON TO ANALYZE</span>
      </div>
    </div>
  );

  return (
    <div className="absolute top-20 right-4 w-96 z-20">
      <div className="bg-panel/85 backdrop-blur border border-panelEdge rounded-sm shadow-neon-green p-6 relative flex flex-col">
        <div className="absolute -top-3 left-4 bg-neonGreen text-black font-mono text-[10px] px-2 py-0.5">
          // SITE_ANALYSIS
        </div>
        
        {loading && (
          <div className="font-mono text-neonCyan text-xs mb-2">
            // ANALYZING...
          </div>
        )}

        {scoreData && (
          <>
            <div className="flex items-baseline gap-4 mb-4">
              <h1 className="font-sans font-bold text-6xl text-neonGreen tracking-tighter">
                {scoreData.score}
              </h1>
              <span className="font-mono text-textMuted text-xl">/ 100</span>
              <span className="ml-auto border border-neonGreen text-neonGreen font-mono px-2 py-0.5 rounded-sm">
                {scoreData.grade}
              </span>
            </div>

            <div className="space-y-4">
              {scoreData.factors.map(f => {
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
              <div className="mt-4 border-t border-panelEdge pt-4 space-y-2">
                {scoreData.flags.map((flag, idx) => (
                  <div key={idx} className="flex gap-2 font-mono text-xs text-neonMagenta">
                    <span>[!]</span>
                    <span>{flag.text}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <WeightSliders 
          weights={weights} 
          onChange={(k, v) => setWeight(k, v)} 
          onReset={resetWeights} 
        />

        <div className="mt-4 flex gap-2">
          <button 
            onClick={() => addToCompare(selectedSite)}
            className="flex-1 border border-neonCyan text-neonCyan hover:bg-neonCyan hover:text-black font-mono text-[10px] uppercase px-2 py-2 rounded-sm transition-colors text-center whitespace-nowrap"
          >
            PIN TO COMPARE
          </button>
          <button 
            onClick={() => {
              fetchIsochrone(selectedSite.lat, selectedSite.lon).then(data => {
                setIsochroneData(data);
                if (!activeLayers.includes('isochrone')) {
                  toggleLayer('isochrone');
                }
              });
            }}
            className="flex-1 border border-neonCyan text-neonCyan hover:bg-neonCyan hover:text-black font-mono text-[10px] uppercase px-2 py-2 rounded-sm transition-colors text-center whitespace-nowrap"
          >
            ISOCHRONE
          </button>
          <button 
            onClick={() => {
              if (scoreData?.h3) {
                window.open(reportUrl(scoreData.h3, preset), '_blank');
              }
            }}
            className="flex-1 border border-neonGreen text-neonGreen hover:bg-neonGreen hover:text-black font-mono text-[10px] uppercase px-2 py-2 rounded-sm transition-colors text-center whitespace-nowrap"
          >
            EXPORT PDF
          </button>
        </div>
      </div>
    </div>
  );
}
