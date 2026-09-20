import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const STATS = [
  { label: 'Austin H3 Cells', value: '2,400+', sub: 'Res-9 (~100m radius)', color: '#059669' },
  { label: 'Catchment Speed', value: '< 45ms', sub: 'Drive-Time Isochrones', color: '#0284C7' },
  { label: 'Data Provenance', value: '4 Sources', sub: 'Census, OSM, FEMA, EPA', color: '#D97706' },
  { label: 'Decision Engine', value: 'SHAP AI', sub: 'Feature-Level Attribution', color: '#7C3AED' },
];

const STEPS = [
  {
    n: '01',
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    border: 'rgba(5,150,105,0.2)',
    title: 'Define Business Requirements',
    body: 'Set your target unit economics: minimum 10-minute population density, footfall traffic targets, competitor proximity buffers, and strict flood-free tolerances.',
    badge: '✓ Automated criteria calibration',
  },
  {
    n: '02',
    color: '#0284C7',
    bg: 'rgba(2,132,199,0.08)',
    border: 'rgba(2,132,199,0.2)',
    title: 'Spatial AI & Hotspot Indexing',
    body: 'Our pipeline models 2,400+ Austin hexagons with spatial decay curves and Getis-Ord Gi* hotspot statistics to pinpoint high-velocity demand clusters.',
    badge: '✓ Getis-Ord Gi* Z-Scores > 1.96',
  },
  {
    n: '03',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.2)',
    title: 'Explain, Save & Benchmark',
    body: 'Understand why each site scores high via SHAP waterfall attribution, save top prospects to custom boards, and generate boardroom PDF dossiers.',
    badge: '✓ 1-Click PDF & CSV Reports',
  },
];

const FEATURES = [
  { icon: '📍', title: 'Uber H3 Res-9 Hexagons', desc: 'Equi-distant hexagonal spatial units that eliminate boundary distortion and model real-world catchment geometry.' },
  { icon: '🧠', title: 'SHAP Decision Explainability', desc: 'Transparent feature attribution displaying exact positive and negative drivers relative to the metro baseline score.' },
  { icon: '🔖', title: 'Instagram-Style Collections', desc: 'Bookmark sites into custom team boards, track status workflows, rent estimates, and team field comments.' },
  { icon: '🚗', title: '5/10/15-Min Isochrones', desc: 'Real-time drive-time catchment polygons with reachable population calculation for every candidate site.' },
  { icon: '⚖️', title: 'Multi-Site Benchmark Matrix', desc: 'Side-by-side comparative matrix ranking candidate parcels with category winner badges and export options.' },
  { icon: '🛡️', title: 'FEMA & EPA Hazard Auditing', desc: 'Automatic penalty factoring for parcels situated in 100-year flood zones or high air pollution areas.' },
];

function HexGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-[0.035]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex-pattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 56,16 56,36 30,50 4,36 4,16" fill="none" stroke="#0F172A" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-pattern)" />
      </svg>
    </div>
  );
}

function CountUp({ target, duration = 1800 }: { target: string; duration?: number }) {
  const [display, setDisplay] = useState('0');
  const ran = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    const suffix = target.replace(/[0-9.]/g, '');
    if (isNaN(num) || ran.current) return;

    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || ran.current) return;
      ran.current = true;
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const val = num * ease;
        setDisplay((val % 1 === 0 || p === 1) ? `${Math.round(val)}${suffix}` : `${val.toFixed(0)}${suffix}`);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{display || target}</span>;
}

export default function LandingPage() {
  const { setAuthView } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      {/* Subtle hex background texture */}
      <HexGrid />

      {/* ── TOP NAV (matches TopBar theme exactly) ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between px-6 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="font-sans font-black text-sm text-slate-900 tracking-tight leading-none">TERRASCORER</div>
            <div className="font-mono text-[9px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">ENTERPRISE SPATIAL AI</div>
          </div>
          <span className="font-mono uppercase tracking-widest text-[10px] text-slate-400 border border-slate-200 px-2 py-0.5 rounded-md ml-2 hidden xl:inline-block">
            📍 AUSTIN, TX
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
          {['Capabilities', 'How It Works', 'SHAP AI', 'Methodology'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
              className="font-mono text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all font-medium whitespace-nowrap"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAuthView('login')}
            className="px-3.5 py-1.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => setAuthView('register')}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-mono text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95"
          >
            <span>🔐 Get Started</span>
            <span>→</span>
          </button>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 px-6 max-w-6xl mx-auto text-center z-10">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[11px] mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold uppercase tracking-wide">Proven for Retail · EV Charging · Logistics Expansion</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
          Deterministic Site Intelligence
          <br />
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 bg-clip-text text-transparent">
            Powered by Spatial AI & H3 Grids
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
          Eliminate intuition-based expansion risks. TerraScorer combines Uber H3 hexagonal tessellation, multi-modal drive-time catchments, and{' '}
          <strong className="text-slate-700">SHAP decision attribution</strong> to identify high-conviction commercial parcels in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <button
            onClick={() => setAuthView('register')}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-black text-white font-mono text-sm font-bold uppercase rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
          >
            <span>📋 Register & Set Criteria</span>
            <span>→</span>
          </button>
          <button
            onClick={() => setAuthView('login')}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-mono text-sm font-bold uppercase rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🔐 Sign In to Workspace</span>
          </button>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</div>
              <div className="text-2xl font-black font-mono mb-0.5" style={{ color: s.color }}>
                <CountUp target={s.value} />
              </div>
              <div className="text-[11px] text-slate-500 font-sans">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MAP PREVIEW STRIP ──────────────────────────────────────────────── */}
      <section className="py-6 px-6 max-w-6xl mx-auto z-10 relative">
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900 flex items-center justify-center" style={{ height: 240 }}>
          {/* Simulated Austin hex map preview */}
          <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-0 opacity-40"
              style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A2F 50%, #0C1A2E 100%)' }} />
            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hex-map" x="0" y="0" width="54" height="47" patternUnits="userSpaceOnUse">
                  <polygon points="27,2 51,15 51,32 27,45 3,32 3,15" fill="none" stroke="#10B981" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hex-map)" />
            </svg>
            {/* Glowing hex cells */}
            {[
              { x: '28%', y: '35%', color: '#10B981', size: 36 },
              { x: '42%', y: '55%', color: '#06B6D4', size: 32 },
              { x: '58%', y: '30%', color: '#10B981', size: 40 },
              { x: '52%', y: '60%', color: '#F59E0B', size: 28 },
              { x: '35%', y: '65%', color: '#06B6D4', size: 30 },
              { x: '70%', y: '45%', color: '#10B981', size: 34 },
            ].map((h, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-pulse"
                style={{
                  left: h.x, top: h.y,
                  width: h.size, height: h.size,
                  background: h.color + '40',
                  boxShadow: `0 0 20px ${h.color}60`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">// LIVE MAP ENGINE</div>
              <div className="font-sans font-black text-white text-lg">Austin Metro · 2,400+ H3 Res-9 Hexagons</div>
              <div className="font-mono text-[11px] text-slate-400 mt-1">Satellite Hybrid · ESRI World Imagery</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 max-w-6xl mx-auto z-10 relative">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-500 font-semibold uppercase tracking-widest mb-3">
            // WORKFLOW ENGINE
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            How TerraScorer Delivers Instant Site Conviction
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md p-8 rounded-2xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div
                  className="w-11 h-11 rounded-xl font-mono font-bold text-base flex items-center justify-center mb-5"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
                >
                  {s.n}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">{s.body}</p>
              </div>
              <div
                className="p-3 rounded-xl font-mono text-[11px] font-semibold"
                style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
              >
                {s.badge}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CAPABILITIES GRID ──────────────────────────────────────────────── */}
      <section id="capabilities" className="py-24 px-6 max-w-6xl mx-auto z-10 relative">
        {/* Section divider */}
        <div className="border-t border-slate-200 mb-16" />
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-500 font-semibold uppercase tracking-widest mb-3">
            // PLATFORM CAPABILITIES
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Built for Commercial Expansion Leaders
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md p-6 rounded-2xl transition-all group"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-slate-900 text-[15px] mb-2 group-hover:text-emerald-700 transition-colors">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SHAP EXPLAINABILITY CALLOUT ────────────────────────────────────── */}
      <section id="shap-ai" className="py-16 px-6 max-w-6xl mx-auto z-10 relative">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 md:p-16 shadow-sm flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 font-mono text-[11px] text-violet-600 font-semibold uppercase tracking-widest mb-4">
              // SHAP EXPLAINABILITY ENGINE
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">
              Know <em className="not-italic text-emerald-600">Why</em> Every Site Scores
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Unlike black-box scoring tools, TerraScorer uses SHAP (SHapley Additive exPlanations) to expose the exact positive and negative feature contributions — demand density, competitor proximity, flood risk, transit access — for every hexagon score.
            </p>
            <button
              onClick={() => setAuthView('register')}
              className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-mono text-xs font-bold rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              Try SHAP Analysis Free →
            </button>
          </div>

          {/* Mini SHAP waterfall preview */}
          <div className="flex-shrink-0 w-full md:w-80 bg-slate-50 border border-slate-200 rounded-2xl p-5 font-mono text-xs">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 font-semibold">// SHAP Feature Contribution</div>
            {[
              { label: 'DEMAND DENSITY', val: 0.82, color: '#059669' },
              { label: 'ACCESSIBILITY', val: 0.71, color: '#059669' },
              { label: 'COMPETITION', val: 0.4, color: '#0284C7' },
              { label: 'COMPLEMENTARITY', val: 0.65, color: '#059669' },
              { label: 'LAND USE FIT', val: 0.58, color: '#059669' },
              { label: 'FLOOD RISK', val: 0.15, color: '#E11D48' },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2 mb-2">
                <span className="w-28 text-slate-500 text-[10px] truncate">{r.label}</span>
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.val * 100}%`, backgroundColor: r.color }} />
                </div>
                <span className="w-8 text-right" style={{ color: r.color }}>{r.val}</span>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between">
              <span className="text-slate-400 text-[10px]">COMPOSITE SCORE</span>
              <span className="font-black text-emerald-600 text-base">87 / 100</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-slate-200 bg-white text-center relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Ready to Screen Austin Commercial Real Estate?
          </h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mb-10 leading-relaxed">
            Join leading real estate developers and retail scouts using TerraScorer's spatial intelligence engine.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setAuthView('register')}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-black text-white font-mono text-sm font-bold uppercase rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              Create Your Account →
            </button>
            <button
              onClick={() => setAuthView('login')}
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-sm font-bold uppercase rounded-xl transition-all cursor-pointer"
            >
              Sign In to Workspace
            </button>
          </div>
        </div>

        <div className="mt-16 text-slate-400 text-[11px] font-mono">
          © {new Date().getFullYear()} TerraScorer Spatial Intelligence Systems · Austin Metro Edition
        </div>
      </section>
    </div>
  );
}
