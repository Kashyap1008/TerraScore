import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import CompareModal from './CompareModal';

export default function CompareTray() {
  const { compareList, removeFromCompare } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-panel/90 backdrop-blur border-t border-panelEdge z-20 flex items-center px-4 justify-between">
        <div className="flex gap-4">
          {compareList.map((site, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-panel border border-panelEdge px-3 py-1 rounded-sm">
              <span className="font-mono text-neonCyan text-xs">
                {site.lat.toFixed(3)}, {site.lon.toFixed(3)}
              </span>
              <button 
                onClick={() => removeFromCompare(idx)}
                className="text-neonMagenta hover:text-white font-mono"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <button 
          disabled={compareList.length < 2}
          onClick={() => setModalOpen(true)}
          className={`font-mono text-xs uppercase px-4 py-2 rounded-sm border transition-colors
            ${compareList.length >= 2 
              ? 'border-neonGreen text-neonGreen hover:bg-neonGreen hover:text-black' 
              : 'border-panelEdge text-textMuted cursor-not-allowed'}`}
        >
          COMPARE
        </button>
      </div>
      
      <CompareModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
