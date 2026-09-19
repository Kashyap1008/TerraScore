import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const LAYERS = [
  { id: 'h3_grid', label: 'SITE_SCORES' },
  { id: 'roads', label: 'ROAD_NETWORK' },
  { id: 'flood_zones', label: 'FLOOD_ZONES' },
  { id: 'pois', label: 'COMPETITORS' },
  { id: 'transit_stops', label: 'TRANSIT_STOPS' }
];

export default function LayerPanel() {
  const { activeLayers, toggleLayer } = useAppStore();
  const [opacity, setOpacity] = useState(80);

  return (
    <div className="absolute top-20 left-4 w-64 z-20 bg-panel/85 backdrop-blur border border-panelEdge rounded-sm shadow-neon-cyan">
      <div className="font-mono text-textMuted text-[10px] uppercase tracking-widest border-b border-panelEdge px-3 py-2">
        // DATA_LAYERS
      </div>
      <div className="p-3 flex flex-col gap-2">
        {LAYERS.map(layer => {
          const isActive = activeLayers.includes(layer.id);
          return (
            <button 
              key={layer.id} 
              onClick={() => toggleLayer(layer.id)}
              className="flex items-center gap-2 text-left"
            >
              <span className="font-mono text-neonGreen text-xs w-6">
                {isActive ? '[x]' : '[ ]'}
              </span>
              <span className="font-mono uppercase text-xs text-textMain">
                {layer.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-panelEdge px-3 py-2">
        <div className="font-mono text-textMuted text-[10px] uppercase tracking-widest mb-2">
          // OPACITY
        </div>
        <input 
          type="range" 
          min="0" max="100" 
          value={opacity}
          onChange={e => setOpacity(parseInt(e.target.value))}
          className="w-full accent-[#CCFF00]"
        />
      </div>
    </div>
  );
}
