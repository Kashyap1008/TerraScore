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
  const { activeLayers, compareList, setSelectedSite } = useAppStore();

  if (!booted) return <TerminalBoot onComplete={() => setBooted(true)} />;

  return (
    <div className="relative w-screen h-screen bg-base text-textMain overflow-hidden">
      <TopBar />
      <div className="absolute inset-0 z-0">
        <MapView
          activeLayers={activeLayers}
          onMapClick={(lat, lon) => setSelectedSite({ lat, lon })}
          onPolygonDraw={(g) => console.log('polygon', g)}
          candidatePins={compareList}
        />
      </div>
      <LayerPanel />
      <SiteScoreCard />
      <CompareTray />
    </div>
  );
}
