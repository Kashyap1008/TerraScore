import React from 'react';
import { useAppStore } from '../store/useAppStore';

const LAYERS = [
  { id: 'h3_grid', label: 'SITE_SCORES' },
  { id: 'roads', label: 'ROAD_NETWORK' },
  { id: 'flood_zones', label: 'FLOOD_ZONES' },
  { id: 'pois', label: 'COMPETITORS' },
  { id: 'transit_stops', label: 'TRANSIT_STOPS' },
  { id: 'hotspots', label: 'HOTSPOTS' },
  { id: 'isochrone', label: 'ISOCHRONE' }
];

export default function LayerPanel() {
  const { activeLayers, toggleLayer, layerOpacity, setLayerOpacity, setSelectedSite, setFlyTo } = useAppStore();

  const handleDemoPin = (lat: number, lon: number) => {
    setSelectedSite({ lat, lon });
    setFlyTo({ lat, lon, zoom: 14 });
  };

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
      <div className="border-t border-panelEdge px-3 py-2 mt-2">
        <div className="font-mono text-textMuted text-[10px] uppercase tracking-widest mb-3">
          // DEMO_PINS
        </div>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => handleDemoPin(19.0657, 72.8687)}
            className="w-full text-left font-mono text-xs uppercase px-2 py-1.5 border border-panelEdge hover:border-neonGreen hover:text-neonGreen transition-colors"
          >
            [ BKC_FINANCIAL ]
          </button>
          <button 
            onClick={() => handleDemoPin(19.0700, 72.8750)}
            className="w-full text-left font-mono text-xs uppercase px-2 py-1.5 border border-panelEdge hover:border-neonGreen hover:text-neonGreen transition-colors"
          >
            [ FLOOD_RISK_KUR]
          </button>
          <button 
            onClick={() => handleDemoPin(12.9716, 77.7499)}
            className="w-full text-left font-mono text-xs uppercase px-2 py-1.5 border border-panelEdge hover:border-neonGreen hover:text-neonGreen transition-colors"
          >
            [ BLR_WHITEFIELD ]
          </button>
        </div>
      </div>
    </div>
  );
}
