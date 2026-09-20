import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchScore } from '../api/client';
import type { ScoreResponse } from '../api/types';
import { resolveLocationName } from '../utils/locationResolver';

export default function CompareView() {
  const {
    compareList,
    preset,
    weights,
    removeFromCompare,
    clearCompare,
    setCurrentView,
    setSelectedSite,
    setFlyTo,
    saveComparisonDeck,
    savedComparisons,
    deleteComparisonDeck,
  } = useAppStore();

  const [data, setData] = useState<(ScoreResponse | null)[]>([]);
  const deckTitle = 'Austin Q3 Retail Site Benchmark';
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (compareList.length > 0) {
      Promise.all(compareList.map((s) => fetchScore(s.lat, s.lon, preset, weights)))
        .then((res) => {
          setData(res);
        })
        .catch(() => {});
    } else {
      Promise.resolve().then(() => setData([]));
    }
  }, [compareList, preset, weights]);

  const getWinner = (rowType: string, factorKey?: string) => {
    let bestIdx = -1;
    let bestVal = -Infinity;
    data.forEach((d, i) => {
      if (!d) return;
      let val = -Infinity;
      if (rowType === 'SCORE') val = d.score;
      else if (factorKey) {
        const factor = d.factors.find((f) => f.key === factorKey);
        if (factor) val = factor.raw;
      }
      if (val > bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    });
    return bestIdx;
  };

  const factors = data[0]?.factors || [
    { key: 'demand', label: 'Demand', raw: 0 },
    { key: 'accessibility', label: 'Accessibility', raw: 0 },
    { key: 'competition', label: 'Competition', raw: 0 },
    { key: 'complementarity', label: 'Complementarity', raw: 0 },
    { key: 'landuse', label: 'Land Use', raw: 0 },
    { key: 'risk', label: 'Risk Buffer', raw: 0 },
  ];

  const scoreWinner = getWinner('SCORE');
  const factorWinners: Record<string, number> = {};
  factors.forEach((f) => {
    factorWinners[f.key] = getWinner('FACTOR', f.key);
  });

  const handleSaveDeck = () => {
    const sites = compareList.map((s, idx) => {
      const loc = resolveLocationName(s.lat, s.lon);
      return {
        lat: s.lat,
        lon: s.lon,
        name: loc.name,
        score: data[idx]?.score || 75,
      };
    });
    saveComparisonDeck(deckTitle, sites);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="pt-20 pb-16 px-6 max-w-7xl mx-auto font-sans min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⚖️</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              MULTI-SITE COMPARISON MATRIX & BENCHMARK
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            SIDE-BY-SIDE EVALUATION OF CANDIDATE SITES WITH ATTRIBUTION DELTAS AND WINNER HIGHLIGHTS
          </p>
        </div>

        <div className="flex items-center gap-2">
          {compareList.length > 0 && (
            <>
              <button
                onClick={clearCompare}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={handleSaveDeck}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>💾 {saveSuccess ? 'Saved Deck!' : 'Save Deck'}</span>
              </button>
            </>
          )}
          <button
            onClick={() => setCurrentView('explorer')}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-mono text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Open Map
          </button>
        </div>
      </div>

      {compareList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="text-4xl mb-3">⚖️</div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No sites in comparison tray</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 font-mono">
            Go to the Map Explorer or Saved Collections and click "+ Compare" on 2 or more sites to benchmark them side by side.
          </p>
          <button
            onClick={() => setCurrentView('explorer')}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            SELECT SITES ON MAP
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="py-4 px-5 w-48">METRIC / ATTRIBUTE</th>
                    {compareList.map((site, i) => {
                      const loc = resolveLocationName(site.lat, site.lon);
                      return (
                        <th key={i} className="py-4 px-5 min-w-[200px] border-l border-slate-200">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-sans font-bold text-slate-900 text-xs">
                                {loc.name}
                              </div>
                              <div className="text-emerald-700 text-[10px] font-mono font-medium">
                                {loc.submarket}
                              </div>
                              <div className="text-slate-400 text-[10px] font-mono">
                                {loc.coordsFormatted}
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCompare(i)}
                              className="text-slate-400 hover:text-rose-600 font-mono text-sm cursor-pointer p-0.5"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Total Suitability Score Row */}
                  <tr className="bg-slate-50/50">
                    <td className="py-4 px-5 font-mono font-bold text-slate-900 uppercase">
                      OVERALL SCORE
                    </td>
                    {data.map((d, i) => {
                      const isWinner = i === scoreWinner;
                      return (
                        <td
                          key={i}
                          className={`py-4 px-5 border-l border-slate-200 ${
                            isWinner ? 'bg-emerald-50/60' : ''
                          }`}
                        >
                          <div className="flex items-baseline gap-2 font-mono">
                            <span
                              className="text-3xl font-black"
                              style={{
                                color:
                                  (d?.score || 0) >= 80
                                    ? '#059669'
                                    : (d?.score || 0) >= 60
                                    ? '#0284C7'
                                    : (d?.score || 0) >= 40
                                    ? '#D97706'
                                    : '#DC2626',
                              }}
                            >
                              {d ? d.score : '...'}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">/ 100</span>
                            {isWinner && (
                              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full ml-auto">
                                🏆 TOP PICK
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Factor Breakdown Rows */}
                  {factors.map((f) => (
                    <tr key={f.key} className="hover:bg-slate-50/50">
                      <td className="py-3 px-5 font-medium text-slate-700 uppercase font-mono text-[11px]">
                        {f.label}
                      </td>
                      {data.map((d, i) => {
                        const factorObj = d?.factors.find((fac) => fac.key === f.key);
                        const isFactorWinner = factorWinners[f.key] === i;
                        const val = factorObj ? factorObj.raw : 0;
                        const pct = Math.round(val * 100);

                        return (
                          <td
                            key={i}
                            className={`py-3 px-5 border-l border-slate-200 ${
                              isFactorWinner ? 'bg-emerald-50/30' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono mb-1">
                              <span className="font-bold text-slate-800 text-xs">{val.toFixed(2)}</span>
                              {isFactorWinner && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded-xs">
                                  BEST
                                </span>
                              )}
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-800 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Action Row */}
                  <tr className="bg-slate-50/50">
                    <td className="py-3 px-5 font-mono text-slate-500 uppercase text-[10px] font-bold">
                      Actions
                    </td>
                    {compareList.map((site, i) => (
                      <td key={i} className="py-3 px-5 border-l border-slate-200">
                        <button
                          onClick={() => {
                            setSelectedSite({ lat: site.lat, lon: site.lon });
                            setFlyTo({ lat: site.lat, lon: site.lon, zoom: 15 });
                            setCurrentView('explorer');
                          }}
                          className="w-full py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer"
                        >
                          Fly To Site
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Saved Comparison Decks History */}
      {savedComparisons.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">
            Saved Benchmark Decks ({savedComparisons.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedComparisons.map((deck) => (
              <div
                key={deck.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-sm text-slate-900">{deck.title}</h4>
                  <button
                    onClick={() => deleteComparisonDeck(deck.id)}
                    className="text-slate-400 hover:text-rose-600 font-mono text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mb-3">
                  {deck.sites.length} Sites • {new Date(deck.createdAt).toLocaleDateString()}
                </div>
                <div className="space-y-1 text-xs">
                  {deck.sites.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="truncate text-slate-700">{s.name}</span>
                      <span className="font-mono font-bold text-slate-900">{s.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
