import React, { useState } from 'react';
import MapView from './components/MapView';
import TopBar from './components/TopBar';
import LayerPanel from './components/LayerPanel';
import SiteScoreCard from './components/SiteScoreCard';
import CompareTray from './components/CompareTray';
import TerminalBoot from './components/TerminalBoot';
import BatchResultsPanel from './components/BatchResultsPanel';
import IsochronePanel from './components/IsochronePanel';
import BookmarkModal from './components/BookmarkModal';
import CollectionsView from './components/CollectionsView';
import RequirementForm from './components/RequirementForm';
import CompareView from './components/CompareView';
import MethodologyView from './components/MethodologyView';
import AuthModal from './components/AuthModal';
import ProfileSettings from './components/ProfileSettings';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LandingPage from './components/LandingPage';
import OnboardingWizard from './components/OnboardingWizard';
import { useAppStore } from './store/useAppStore';
import { fetchBatch } from './api/client';

export default function App() {
  const [booted, setBooted] = useState(false);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [showBatch, setShowBatch] = useState(false);

  const {
    showLandingPage,
    authView,
    currentUser,
    currentView,
    activeLayers,
    compareList,
    setSelectedSite,
    drawnPolygon,
    setDrawnPolygon,
    preset,
  } = useAppStore();

  if (!booted) return <TerminalBoot onComplete={() => setBooted(true)} />;

  // 1. Dedicated Full-Page Login View
  if (authView === 'login') {
    return <LoginPage />;
  }

  // 2. Dedicated Full-Page Registration View
  if (authView === 'register') {
    return <RegisterPage />;
  }

  // 3. SaaS Landing Page (Unauthenticated Entry Point)
  if (showLandingPage) {
    return (
      <div className="relative w-screen h-screen overflow-y-auto bg-slate-950 font-sans">
        <LandingPage />
        <OnboardingWizard />
      </div>
    );
  }

  // 4. Authentication Guard: Redirect to Login if unauthenticated
  if (!currentUser) {
    return <LoginPage />;
  }

  const handleFindTopSites = () => {
    if (drawnPolygon) {
      fetchBatch(drawnPolygon, preset).then((data) => {
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
    <div className="relative w-screen h-screen bg-slate-100 text-textMain overflow-hidden font-sans">
      {/* Universal Enterprise Navigation Header */}
      <TopBar />

      {/* Main Multi-View Routing */}
      {currentView === 'explorer' ? (
        <>
          {/* Active Polygon Search Notification */}
          {drawnPolygon && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-white/95 backdrop-blur border border-slate-200 px-4 py-2 rounded-xl shadow-lg">
              <span className="font-mono text-emerald-800 text-xs font-bold tracking-wider">
                // SEARCH ZONE READY
              </span>
              <button
                onClick={handleFindTopSites}
                className="font-mono bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                FIND TOP SITES
              </button>
              <button
                onClick={handleClearSearch}
                className="font-mono text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer hover:underline"
              >
                CLEAR
              </button>
            </div>
          )}

          <IsochronePanel />
          <BatchResultsPanel
            results={batchResults}
            visible={showBatch}
            onClose={() => setShowBatch(false)}
          />

          {/* Interactive Map Core Engine */}
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
        </>
      ) : currentView === 'requirements' ? (
        <div className="relative z-10 w-full h-full overflow-y-auto bg-slate-50">
          <RequirementForm />
        </div>
      ) : currentView === 'collections' ? (
        <div className="relative z-10 w-full h-full overflow-y-auto bg-slate-50">
          <CollectionsView />
        </div>
      ) : currentView === 'compare' ? (
        <div className="relative z-10 w-full h-full overflow-y-auto bg-slate-50">
          <CompareView />
        </div>
      ) : currentView === 'methodology' ? (
        <div className="relative z-10 w-full h-full overflow-y-auto bg-slate-50">
          <MethodologyView />
        </div>
      ) : null}

      {/* Global Enterprise Modals */}
      <OnboardingWizard />
      <BookmarkModal />
      <AuthModal />
      <ProfileSettings />
    </div>
  );
}
