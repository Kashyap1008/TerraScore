import React from 'react';
import { useAppStore } from '../store/useAppStore';

export default function IsochronePanel() {
  const { isochroneData, selectedSite, activeLayers, setIsochroneData } = useAppStore();

  if (!selectedSite || !isochroneData || !activeLayers.includes('isochrone')) return null;

  const populations = isochroneData.population_reachable || {};
  const rings = [10, 20, 30];
  const maxPop = Math.max(...Object.values(populations).map(Number));

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[360px] bg-panel/90 backdrop-blur border border-panelEdge rounded-sm shadow-neon-cyan z-30 flex flex-col">
      <div className="flex justify-between items-center px-4 py-2 border-b border-panelEdge">
        <span className="font-mono text-textMuted text-[10px] uppercase tracking-widest">// CATCHMENT_ANALYSIS</span>
        <button onClick={() => setIsochroneData(null)} className="text-neonMagenta hover:text-white font-mono">×</button>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {rings.map(mins => {
          const pop = populations[mins] || 0;
          const width = maxPop > 0 ? (pop / maxPop) * 100 : 0;
          return (
            <div key={mins} className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-neonCyan text-xs">{mins} MIN</span>
                <span className="font-mono text-white text-sm">{pop.toLocaleString()}</span>
              </div>
              <div className="h-1 bg-panelEdge relative">
                <div className="absolute top-0 left-0 h-full bg-neonCyan" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
