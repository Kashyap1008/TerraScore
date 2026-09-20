import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchScore, fetchIsochrone, reportUrl } from '../api/client';
import type { ScoreResponse } from '../api/types';
import WeightSliders from './WeightSliders';
import { resolveLocationName } from '../utils/locationResolver';
import ShapExplainability from './ShapExplainability';

export default function SiteScoreCard() {
  const {
    selectedSite,
    preset,
    weights,
    setWeight,
    resetWeights,
    addToCompare,
    setIsochroneData,
    toggleLayer,
    activeLayers,
    setBookmarkModalSite,
    setSelectedSiteScoreData,
  } = useAppStore();

  const [scoreData, setScoreData] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showShap, setShowShap] = useState(false);

  useEffect(() => {
    if (selectedSite) {
      setLoading(true);
      const timer = setTimeout(() => {
        fetchScore(selectedSite.lat, selectedSite.lon, preset, weights).then((data) => {
          setScoreData(data);
          setSelectedSiteScoreData(data);
          setLoading(false);
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setScoreData(null);
      setSelectedSiteScoreData(null);
    }
  }, [selectedSite, preset, weights, setSelectedSiteScoreData]);

  if (!selectedSite || (!scoreData && !loading)) {
    return (
      <div className="absolute top-20 right-4 w-96 z-20">
        <div className="bg-panel/85 backdrop-blur border border-panelEdge rounded-xl shadow-neon-green p-6 flex flex-col items-center justify-center h-32">
          <span className="font-mono text-textMuted text-xs uppercase">// CLICK A HEXAGON TO ANALYZE</span>
        </div>
      </div>
    );
  }

  const locInfo = resolveLocationName(selectedSite.lat, selectedSite.lon, scoreData?.h3);

  return (
    <>
      <div className="absolute top-20 right-4 w-96 z-20 max-h-[calc(100vh-100px)] overflow-y-auto rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="bg-panel/85 backdrop-blur border border-panelEdge rounded-xl shadow-neon-green p-5 relative flex flex-col font-sans">
          <div className="absolute -top-3 left-4 bg-neonGreen text-black font-mono text-[10px] px-2 py-0.5 rounded-xs font-bold">
            // SITE_ANALYSIS
          </div>

          {/* Location Title & Actions Bar */}
          <div className="mb-3 pb-3 border-b border-panelEdge flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5">
              <span className="text-neonGreen text-base leading-none mt-0.5">📍</span>
              <div>
                <div className="text-white font-bold text-sm leading-snug">{locInfo.name}</div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono mt-0.5">
                  <span className="text-neonCyan font-semibold">{locInfo.submarket}</span>
                  <span className="text-textMuted">•</span>
                  <span className="text-textMuted">{locInfo.coordsFormatted}</span>
                </div>
              </div>
            </div>

            {/* Quick Bookmark Button (Instagram style) */}
            <button
              onClick={() =>
                setBookmarkModalSite({
                  lat: selectedSite.lat,
                  lon: selectedSite.lon,
                  score: scoreData?.score,
                  grade: scoreData?.grade,
                  h3: scoreData?.h3,
                  preset,
                })
              }
              className="p-1.5 bg-panel border border-neonGreen/60 hover:bg-neonGreen hover:text-black text-neonGreen rounded-lg transition-all cursor-pointer shadow-xs"
              title="Save Site to Board"
            >
              <span className="text-sm">🔖</span>
            </button>
          </div>

          {loading && (
            <div className="font-mono text-neonCyan text-xs mb-2 animate-pulse">
              // ANALYZING SITE METRICS...
            </div>
          )}

          {scoreData && (
            <>
              <div className="flex items-baseline gap-4 mb-3">
                <h1 className="font-sans font-bold text-5xl text-neonGreen tracking-tighter">
                  {scoreData.score}
                </h1>
                <span className="font-mono text-textMuted text-lg">/ 100</span>
                <span className="ml-auto border border-neonGreen text-neonGreen font-mono px-2 py-0.5 rounded-sm font-bold text-xs">
                  {scoreData.grade}
                </span>
              </div>

              {/* SHAP Explainability Trigger Pill */}
              <button
                onClick={() => setShowShap(true)}
                className="w-full mb-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 font-mono text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>🧠</span>
                <span>Why This Site? (SHAP Explainability)</span>
              </button>

              <div className="space-y-3">
                {scoreData.factors.map((f) => {
                  const width = Math.min(100, Math.max(0, f.raw * 100));
                  const barColor =
                    f.raw >= 0.7 ? 'bg-neonGreen' : f.raw >= 0.4 ? 'bg-neonCyan' : 'bg-neonMagenta';
                  return (
                    <div key={f.key} className="flex items-center gap-3" title={f.explanation}>
                      <span className="font-mono text-textMuted text-xs uppercase w-24 truncate">
                        {f.label}
                      </span>
                      <div className="bg-panelEdge h-1 flex-1 relative">
                        <div
                          className={`absolute top-0 left-0 h-1 ${barColor}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="font-mono text-white text-xs w-8 text-right">
                        {f.raw}
                      </span>
                    </div>
                  );
                })}
              </div>

              {scoreData.flags && scoreData.flags.length > 0 && (
                <div className="mt-3 border-t border-panelEdge pt-3 space-y-1.5">
                  {scoreData.flags.map((flag, idx) => (
                    <div key={idx} className="flex gap-2 font-mono text-xs text-neonMagenta">
                      <span>[!]</span>
                      <span>{flag.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <WeightSliders
            weights={weights}
            onChange={(k, v) => setWeight(k, v)}
            onReset={resetWeights}
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => addToCompare(selectedSite)}
              className="flex-1 border border-neonCyan text-neonCyan hover:bg-neonCyan hover:text-black font-mono text-[10px] uppercase px-2 py-2 rounded-sm transition-colors text-center whitespace-nowrap cursor-pointer"
            >
              PIN TO COMPARE
            </button>
            <button
              onClick={() => {
                fetchIsochrone(selectedSite.lat, selectedSite.lon, [5, 10, 15], 'driving').then((data) => {
                  setIsochroneData(data);
                  if (!activeLayers.includes('isochrone')) {
                    toggleLayer('isochrone');
                  }
                });
              }}
              className="flex-1 border border-neonCyan text-neonCyan hover:bg-neonCyan hover:text-black font-mono text-[10px] uppercase px-2 py-2 rounded-sm transition-colors text-center whitespace-nowrap cursor-pointer"
            >
              ISOCHRONE
            </button>
            <button
              onClick={() => {
                if (scoreData?.h3) {
                  window.open(reportUrl(scoreData.h3, preset), '_blank');
                }
              }}
              className="flex-1 border border-neonGreen text-neonGreen hover:bg-neonGreen hover:text-black font-mono text-[10px] uppercase px-2 py-2 rounded-sm transition-colors text-center whitespace-nowrap cursor-pointer"
            >
              EXPORT PDF
            </button>
          </div>
        </div>
      </div>

      {/* SHAP Modal Popup */}
      {showShap && scoreData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <ShapExplainability
            score={scoreData.score}
            grade={scoreData.grade}
            preset={preset}
            factors={scoreData.factors}
            onClose={() => setShowShap(false)}
          />
        </div>
      )}
    </>
  );
}
