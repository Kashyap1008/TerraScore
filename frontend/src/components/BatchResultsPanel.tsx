import React from 'react';
import { useAppStore } from '../store/useAppStore';

export default function BatchResultsPanel({ results, visible, onClose }: { results: any[]; visible: boolean; onClose: () => void }) {
  const { setSelectedSite } = useAppStore();

  if (!visible) return null;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-24 w-[480px] max-h-[40vh] overflow-y-auto bg-panel/90 backdrop-blur border border-panelEdge rounded-sm shadow-neon-green z-30 flex flex-col">
      <div className="sticky top-0 bg-panel border-b border-panelEdge px-4 py-2 flex justify-between items-center z-10">
        <span className="font-mono text-textMuted text-[10px] uppercase tracking-widest">// TOP_SITES_IN_ZONE</span>
        <button onClick={onClose} className="text-neonMagenta hover:text-white font-mono">×</button>
      </div>
      <div className="p-2 flex flex-col gap-1">
        {results.map((r, i) => (
          <button 
            key={r.h3 || r.rank || i}
            onClick={() => setSelectedSite({ lat: r.lat, lon: r.lon })}
            className="flex items-center gap-3 p-2 hover:bg-panelEdge text-left transition-colors"
          >
            <span className="font-mono text-textMuted text-xs w-6">{r.rank || i+1}</span>
            <span className="font-mono text-neonGreen text-sm font-bold w-12">{r.score?.toFixed(1) || r.score}</span>
            <span className="font-mono text-[10px] text-textMuted flex-1 truncate">{r.lat.toFixed(4)}, {r.lon.toFixed(4)} • {r.h3}</span>
          </button>
        ))}
        {results.length === 0 && (
          <div className="p-4 text-center font-mono text-textMuted text-xs">NO RESULTS FOUND</div>
        )}
      </div>
    </div>
  );
}
