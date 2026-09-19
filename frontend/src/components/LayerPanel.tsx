import React from 'react';
import { useAppStore } from '../store/useAppStore';

const LAYERS = [
  { id: 'h3_grid', label: 'SITE_SCORES' },
  { id: 'roads', label: 'ROAD_NETWORK' },
  { id: 'flood_zones', label: 'FLOOD_ZONES' },
  { id: 'pois', label: 'COMPETITORS' },
  { id: 'transit_stops', label: 'TRANSIT_STOPS' }
];

export default function LayerPanel() {
  const { activeLayers, toggleLayer, layerOpacity, setLayerOpacity } = useAppStore();

  return (
    <div className="absolute top-20 left-4 w-64 z-20 bg-panel/85 backdrop-blur border border-panelEdge rounded-sm shadow-neon-cyan">
      <div className="font-mono text-textMuted text-[10px] uppercase tracking-widest border-b border-panelEdge px-3 py-2">
        // DATA_LAYERS
      </div>
      <div className="p-3 flex flex-col gap-3">
        {LAYERS.map(layer => {
          const isActive = activeLayers.includes(layer.id);
          const opacity = layerOpacity[layer.id] !== undefined ? layerOpacity[layer.id] : 1;
          
          return (
            <div key={layer.id} className="flex flex-col gap-2">
              <button 
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
              
              {isActive && (
                <div className="ml-8 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-textMuted">OPACITY</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05"
                    value={opacity}
                    onChange={e => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                    className="flex-1 accent-[#00E5FF]"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
