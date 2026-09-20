import { useState, useEffect } from 'react';

export default function WeightSliders({ 
  weights, 
  onChange, 
  onReset 
}: { 
  weights: Record<string, number>; 
  onChange: (key: string, v: number) => void; 
  onReset: () => void 
}) {
  const [localWeights, setLocalWeights] = useState(weights);

  useEffect(() => {
    Promise.resolve().then(() => setLocalWeights(weights));
  }, [weights]);

  const handleChange = (key: string, val: number) => {
    setLocalWeights(prev => ({ ...prev, [key]: val }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      Object.keys(localWeights).forEach(k => {
        if (localWeights[k] !== weights[k]) {
          onChange(k, localWeights[k]);
        }
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [localWeights, onChange, weights]);

  return (
    <div className="mt-4 border-t border-panelEdge pt-4">
      <div className="font-mono text-textMuted text-[10px] uppercase tracking-widest mb-3">
        // WEIGHT_CONFIG
      </div>
      <div className="space-y-2">
        {Object.entries(localWeights).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 shrink-0">
            <span className="font-mono uppercase text-[10px] text-textMuted w-24 truncate">{key}</span>
            <input 
              type="range" 
              min="0" max="1" step="0.05"
              value={val}
              onChange={e => handleChange(key, parseFloat(e.target.value))}
              className="flex-1 accent-[#CCFF00]"
            />
            <span className="font-mono text-neonGreen text-xs w-10 text-right">{val.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <button 
        onClick={onReset}
        className="mt-3 font-mono text-neonMagenta underline hover:no-underline text-[10px]"
      >
        RESET
      </button>
    </div>
  );
}
