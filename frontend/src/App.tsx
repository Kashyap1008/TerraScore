import React, { useState } from 'react';
import MapView from './components/MapView';
import TopBar from './components/TopBar';
import LayerPanel from './components/LayerPanel';
import SiteScoreCard from './components/SiteScoreCard';
import CompareTray from './components/CompareTray';
import TerminalBoot from './components/TerminalBoot';
import BatchResultsPanel from './components/BatchResultsPanel';
import IsochronePanel from './components/IsochronePanel';
import { useAppStore } from './store/useAppStore';
import { fetchBatch } from './api/client';

export default function App() {
  const [booted, setBooted] = useState(false);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [showBatch, setShowBatch] = useState(false);
  
  const { activeLayers, compareList, setSelectedSite, drawnPolygon, setDrawnPolygon, preset } = useAppStore();

  if (!booted) return <TerminalBoot onComplete={() => setBooted(true)} />;

  const handleFindTopSites = () => {
    if (drawnPolygon) {
      fetchBatch(drawnPolygon, preset).then(data => {
        setBatchResults(data.results || []);
        setShowBatch(true);
      });
    }
  };

  const handleClearSearch = () => {
    setDrawnPolygon(null);
    setShowBatch(false);
  };

  return (
    <div className="relative w-screen h-screen bg-base text-textMain overflow-hidden">
      <TopBar />
      
      {drawnPolygon && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-panel/80 backdrop-blur border border-panelEdge px-4 py-2 rounded-sm shadow-neon-green">
          <span className="font-mono text-neonGreen text-xs tracking-widest">// SEARCH_ZONE READY —</span>
          <button 
            onClick={handleFindTopSites}
            className="font-mono bg-neonGreen text-black text-xs font-bold px-2 py-0.5 rounded-sm hover:brightness-110"
          >
            [FIND TOP SITES]
          </button>
          <button 
            onClick={handleClearSearch}
            className="font-mono text-neonMagenta text-xs hover:underline"
          >
            CLEAR
          </button>
        </div>
      )}

      <IsochronePanel />
      <BatchResultsPanel results={batchResults} visible={showBatch} onClose={() => setShowBatch(false)} />

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
