import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchScore } from '../api/client';
import type { ScoreResponse } from '../api/types';

export default function CompareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { compareList, preset, weights } = useAppStore();
  const [data, setData] = useState<(ScoreResponse | null)[]>([]);

  useEffect(() => {
    if (open) {
      Promise.all(compareList.map(s => fetchScore(s.lat, s.lon, preset, weights))).then(setData);
    }
  }, [open, compareList, preset, weights]);

  if (!open) return null;

  const getWinner = (rowType: string, factorKey?: string) => {
    let bestIdx = -1;
    let bestVal = -Infinity;
    data.forEach((d, i) => {
      if (!d) return;
      let val = -Infinity;
      if (rowType === 'SCORE') val = d.score;
      else if (factorKey) {
        const factor = d.factors.find(f => f.key === factorKey);
        if (factor) val = factor.raw;
      }
      if (val > bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    });
    return bestIdx;
  };

  const factors = data[0]?.factors || [];
  const scoreWinner = getWinner('SCORE');
  const factorWinners: Record<string, number> = {};
  factors.forEach(f => {
    factorWinners[f.key] = getWinner('FACTOR', f.key);
  });

  return (
    <div className="fixed inset-0 z-50 bg-base/95 backdrop-blur flex items-center justify-center p-8">
      <div className="w-full max-w-5xl bg-panel border border-panelEdge shadow-neon-cyan flex flex-col h-full max-h-[80vh]">
        <div className="font-mono text-neonCyan p-4 border-b border-panelEdge">
          // SITE_COMPARISON
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left font-mono text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-2 border-b border-panelEdge text-textMuted uppercase text-xs">Metric</th>
                {compareList.map((site, i) => (
                  <th key={i} className="p-2 border-b border-panelEdge text-white text-xs">
                    Site {i + 1} <br/>
                    <span className="text-neonCyan text-[10px]">{site.lat.toFixed(4)}, {site.lon.toFixed(4)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-panelEdge text-textMuted">SCORE</td>
                {data.map((d, i) => {
                  const isWinner = i === scoreWinner;
                  return (
                    <td key={i} className={`p-2 border-b border-panelEdge ${isWinner ? 'border-2 border-neonGreen text-neonGreen' : 'text-white'}`}>
                      {d ? d.score : '...'} {isWinner && '✓'}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-2 border-b border-panelEdge text-textMuted">GRADE</td>
                {data.map((d, i) => (
                  <td key={i} className="p-2 border-b border-panelEdge text-neonCyan">{d?.grade || '...'}</td>
                ))}
              </tr>
              <tr>
                <td className="p-2 border-b border-panelEdge text-textMuted">ARCHETYPE</td>
                {data.map((d, i) => (
                  <td key={i} className="p-2 border-b border-panelEdge text-textMuted">{d?.archetype || '...'}</td>
                ))}
              </tr>
              {factors.map(f => (
                <tr key={f.key}>
                  <td className="p-2 border-b border-panelEdge text-textMuted uppercase">{f.label}</td>
                  {data.map((d, i) => {
                    const isWinner = i === factorWinners[f.key];
                    const factor = d?.factors.find(x => x.key === f.key);
                    const raw = factor?.raw || 0;
                    const color = raw >= 0.7 ? 'text-neonGreen' : raw >= 0.4 ? 'text-neonCyan' : 'text-neonMagenta';
                    return (
                      <td key={i} className={`p-2 border-b border-panelEdge ${isWinner ? 'border-2 border-neonGreen' : ''} ${color}`}>
                        {raw} {isWinner && '✓'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-panelEdge flex gap-4 justify-end">
          <button 
            onClick={() => window.print()} 
            className="font-mono text-xs uppercase px-4 py-2 rounded-sm border border-neonCyan text-neonCyan hover:bg-neonCyan hover:text-black transition-colors"
          >
            EXPORT PDF
          </button>
          <button 
            onClick={onClose} 
            className="font-mono text-xs uppercase px-4 py-2 rounded-sm border border-neonMagenta text-neonMagenta hover:bg-neonMagenta hover:text-black transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
