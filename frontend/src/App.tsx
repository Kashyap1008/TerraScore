import { useState } from 'react';
import MapView from './components/MapView';
import TopBar from './components/TopBar';
import LayerPanel from './components/LayerPanel';
import SiteScoreCard from './components/SiteScoreCard';
import CompareTray from './components/CompareTray';
import TerminalBoot from './components/TerminalBoot';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const [booted, setBooted] = useState(false);
  const { activeLayers, compareList, setSelectedSite, drawnPolygon, setDrawnPolygon } = useAppStore();

  if (!booted) return <TerminalBoot onComplete={() => setBooted(true)} />;

  return (
    <div className="relative w-screen h-screen bg-base text-textMain overflow-hidden">
      <TopBar />
      
      {drawnPolygon && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-panel/80 backdrop-blur border border-panelEdge px-4 py-2 rounded-sm shadow-neon-green">
          <span className="font-mono text-neonGreen text-xs tracking-widest">// SEARCH_ZONE ACTIVE</span>
          <button 
            onClick={() => setDrawnPolygon(null)}
            className="font-mono text-neonMagenta text-xs hover:underline"
          >
            CLEAR
          </button>
        </div>
      )}

      <div className="absolute inset-0 z-0">
        <MapView
          activeLayers={activeLayers}
          onMapClick={(lat, lon) => setSelectedSite({ lat, lon })}
          onPolygonDraw={(g) => setDrawnPolygon(g as GeoJSON.Polygon)}
          candidatePins={compareList}
        />
      </div>
      <LayerPanel />
      <SiteScoreCard />
      <CompareTray />
    </div>
  );
}
