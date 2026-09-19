import { useAppStore } from '../store/useAppStore';

const RING_COLORS: Record<number, string> = {
  5:  '#22D3EE',  // cyan-400
  10: '#0EA5E9',  // sky-500
  15: '#3B82F6',  // blue-500
};

export default function IsochronePanel() {
  const { isochroneData, selectedSite, activeLayers, setIsochroneData } = useAppStore();

  if (!selectedSite || !isochroneData || !activeLayers.includes('isochrone')) return null;

  const populations = isochroneData.population_reachable || {};

  // Derive rings from available polygon data (string or number keys)
  const rings = Object.keys(isochroneData.polygons)
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  const maxPop = rings.reduce((max, m) => {
    const pop = Number(populations[String(m)] ?? populations[m] ?? 0);
    return Math.max(max, pop);
  }, 0);

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[340px] bg-slate-900/95 backdrop-blur border border-sky-500/40 rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-sky-500/20 bg-sky-950/60">
        <div className="flex items-center gap-2">
          <span className="text-sky-400 text-base">🔵</span>
          <span className="font-mono text-sky-300 text-[11px] uppercase tracking-widest font-semibold">
            Catchment Analysis
          </span>
        </div>
        <button
          onClick={() => setIsochroneData(null)}
          className="text-slate-400 hover:text-white font-mono text-lg leading-none transition-colors cursor-pointer"
          title="Close"
        >
          ×
        </button>
      </div>

      {/* Drive-time rings */}
      <div className="p-4 flex flex-col gap-3">
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
          Drive-Time Catchment · Austin Urban Grid
        </p>
        {rings.length === 0 ? (
          <p className="text-slate-500 text-xs font-mono">No isochrone data available.</p>
        ) : (
          rings.map((mins) => {
            const pop = Number(populations[String(mins)] ?? populations[mins as unknown as string] ?? 0);
            const pct = maxPop > 0 ? (pop / maxPop) * 100 : 0;
            const color = RING_COLORS[mins] ?? '#38BDF8';
            return (
              <div key={mins} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono font-bold text-xs" style={{ color }}>
                    {mins} MIN DRIVE
                  </span>
                  <span className="font-mono text-white text-sm font-semibold">
                    ~{pop.toLocaleString()} pop.
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer note */}
      <div className="px-4 pb-3 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
        ≈ 0.5 km / min · Austin avg density 1,300 ppl/km²
      </div>
    </div>
  );
}
