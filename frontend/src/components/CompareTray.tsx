import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import CompareModal from './CompareModal';
import { resolveLocationName } from '../utils/locationResolver';

export default function CompareTray() {
  const { compareList, removeFromCompare } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-panel/90 backdrop-blur border-t border-panelEdge z-20 flex items-center px-4 justify-between">
        <div className="flex gap-4 overflow-x-auto">
          {compareList.map((site, idx) => {
            const loc = resolveLocationName(site.lat, site.lon);
            return (
              <div
                key={idx}
                className="flex items-center gap-2.5 bg-panel border border-panelEdge px-3 py-1.5 rounded-sm shadow-xs whitespace-nowrap"
              >
                <span className="text-neonGreen text-xs">📍</span>
                <div className="flex flex-col">
                  <span className="font-sans font-bold text-white text-xs">
                    {loc.name}
                  </span>
                  <span className="font-mono text-textMuted text-[10px]">
                    {loc.coordsFormatted}
                  </span>
                </div>
                <button
                  onClick={() => removeFromCompare(idx)}
                  className="text-neonMagenta hover:text-white font-mono ml-1 px-1 cursor-pointer"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <button
          disabled={compareList.length < 2}
          onClick={() => setModalOpen(true)}
          className={`font-mono text-xs uppercase px-4 py-2 rounded-sm border transition-colors cursor-pointer whitespace-nowrap ml-4
            ${
              compareList.length >= 2
                ? 'border-neonGreen text-neonGreen hover:bg-neonGreen hover:text-black font-semibold'
                : 'border-panelEdge text-textMuted cursor-not-allowed'
            }`}
        >
          COMPARE ({compareList.length})
        </button>
      </div>

      <CompareModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
