import React from 'react';
import { useAppStore } from '../store/useAppStore';

export default function MethodologyView() {
  const { setCurrentView } = useAppStore();

  return (
    <div className="pt-20 pb-20 px-6 max-w-4xl mx-auto font-sans min-h-screen">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-bold text-emerald-700 uppercase tracking-widest">
            TECHNICAL WHITEPAPER & METHODOLOGY
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          How TerraScorer Evaluates Commercial Site Viability
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed font-sans">
          TerraScorer synthesizes petabyte-scale federal demographic records, road topology, POI anchor graphs, and environmental risk layers into a deterministic spatial intelligence engine.
        </p>
      </div>

      {/* Grid of Key Pillars */}
      <div className="space-y-10 text-slate-800 text-sm">
        {/* Pillar 1: H3 Spatial Tessellation */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center justify-center text-sm">
              01
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              H3 Spatial Indexing & Hexagonal Tessellation (Resolution 9)
            </h2>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4 text-xs">
            Unlike square grids or irregular census tracts that distort spatial adjacency, TerraScorer indexes all metro real estate onto <strong>Uber H3 Resolution 9 hexagons</strong> (~100-meter edge length, 0.1 km² surface area). Hexagonal tessellation ensures identical distance to all six neighbors, avoiding diagonal artifact distortions.
          </p>
          <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-center text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Grid Resolution</div>
              <div className="font-bold text-slate-800">H3 Res-9 (~100m)</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Austin Grid Cells</div>
              <div className="font-bold text-slate-800">2,400+ Hexagons</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Spatial Index</div>
              <div className="font-bold text-emerald-700">PostGIS ST_H3</div>
            </div>
          </div>
        </section>

        {/* Pillar 2: Spatial Decay & Isochrone Catchments */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 font-mono font-bold flex items-center justify-center text-sm">
              02
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Drive-Time Isochrones & Exponential Spatial Decay
            </h2>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4 text-xs">
            Customer gravity is never Euclidean (as-the-crow-flies). We compute actual <strong>5, 10, and 15-minute drive-time polygons via self-hosted OSRM routing</strong>. We apply continuous exponential decay curves <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">w(d) = e^(-λd)</code> to weight closer competitors, retail anchors, and resident populations appropriately.
          </p>
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 text-xs text-sky-950 font-mono">
            <div className="font-bold mb-1">📐 Gravity Model Formulation:</div>
            <div>Competitor Decay: S_comp = Σ e^(-0.0015 · d_i) for d_i ≤ 2,000m</div>
            <div>Anchor Synergies: S_anchor = Σ log(1 + visits) · e^(-0.0010 · d_i)</div>
          </div>
        </section>

        {/* Pillar 3: Getis-Ord Gi* Hotspot Analysis */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-mono font-bold flex items-center justify-center text-sm">
              03
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Getis-Ord Gi* Spatial Cluster & Hotspot Statistics
            </h2>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4 text-xs">
            To isolate true regional agglomeration economies from isolated high-score anomalies, we run <strong>Getis-Ord Gi* local statistics</strong>. A cell is classified as a Hotspot only if its value and neighboring values are statistically significantly higher than the global metro mean (z-score &gt; +1.96, p &lt; 0.05).
          </p>
        </section>

        {/* Pillar 4: Verified Data Provenance */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 font-mono font-bold flex items-center justify-center text-sm">
              04
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Verified Data Provenance & Pipelines
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
              <div className="font-bold text-slate-900 mb-1">👥 US Census Bureau & ACS</div>
              <div className="text-slate-500 text-[11px]">Population density, median household income, age demographics.</div>
            </div>
            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
              <div className="font-bold text-slate-900 mb-1">🗺️ OpenStreetMap & OSRM</div>
              <div className="text-slate-500 text-[11px]">Road network classification, traffic signals, speed limits, routing graphs.</div>
            </div>
            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
              <div className="font-bold text-slate-900 mb-1">🌊 FEMA NFHL (Flood Zones)</div>
              <div className="text-slate-500 text-[11px]">100-year and 500-year floodplain polygons (Zones A, AE, X).</div>
            </div>
            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
              <div className="font-bold text-slate-900 mb-1">🍃 EPA AirNow & Sensor APIs</div>
              <div className="text-slate-500 text-[11px]">Decile air quality index, PM2.5 emissions, industrial zone buffers.</div>
            </div>
          </div>
        </section>
      </div>

      {/* CTA Bottom */}
      <div className="mt-12 text-center">
        <button
          onClick={() => setCurrentView('explorer')}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase rounded-xl shadow-md transition-all cursor-pointer"
        >
          🚀 Return to Live Spatial Terminal
        </button>
      </div>
    </div>
  );
}
