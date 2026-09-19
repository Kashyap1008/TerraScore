import React from 'react';
import { useAppStore } from '../store/useAppStore';

export default function LandingPage() {
  const { setAuthView, setIsOnboardingOpen } = useAppStore();

  const handleGetStarted = () => {
    setAuthView('register');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      {/* BACKGROUND GLOWS & GRID */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* TOP NAVIGATION HEADER */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="font-sans font-black text-base text-white tracking-tight leading-none">
              TERRASCORER
            </div>
            <div className="font-mono text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
              ENTERPRISE SPATIAL AI
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-mono text-xs text-slate-300">
          <a href="#features" className="hover:text-emerald-400 transition-colors">
            Capabilities
          </a>
          <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
            How It Works
          </a>
          <a href="#explainability" className="hover:text-emerald-400 transition-colors">
            SHAP Explainability
          </a>
          <a href="#methodology" className="hover:text-emerald-400 transition-colors">
            Methodology
          </a>
        </nav>

        {/* Auth & Launch CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAuthView('login')}
            className="px-4 py-2 text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={handleGetStarted}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black uppercase rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            Get Started Free &rarr;
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6 max-w-6xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-xs mb-6 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>PROVEN FOR RETAIL, EV CHARGING & LOGISTICS EXPANSION</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
          Deterministic Site Intelligence <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Powered by Spatial AI & H3 Grids
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-sans">
          Eliminate intuition-based expansion risks. TerraScorer combines Uber H3 hexagonal tessellation, multi-modal drive-time catchments, and <strong>SHAP decision attribution</strong> to identify high-conviction commercial parcels in seconds.
        </p>

        {/* Primary Call-To-Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-sm font-black uppercase rounded-2xl shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
          >
            <span>📋 REGISTER & SET EXPANSION CRITERIA</span>
            <span>&rarr;</span>
          </button>

          <button
            onClick={() => setAuthView('login')}
            className="w-full sm:w-auto px-7 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-mono text-sm font-bold uppercase rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:border-slate-500"
          >
            <span>🔐 SIGN IN TO WORKSPACE</span>
          </button>
        </div>

        {/* LIVE METRO STATS BANNER */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md shadow-2xl text-left font-mono">
          <div className="border-r border-slate-800/80 pr-3">
            <div className="text-[10px] text-slate-500 uppercase">AUSTIN H3 CELLS</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">2,400+</div>
            <div className="text-[11px] text-slate-400">Res-9 (~100m radius)</div>
          </div>
          <div className="border-r border-slate-800/80 pr-3">
            <div className="text-[10px] text-slate-500 uppercase">CATCHMENT SPEED</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">&lt; 45ms</div>
            <div className="text-[11px] text-slate-400">OSRM Isochrone Engine</div>
          </div>
          <div className="border-r border-slate-800/80 pr-3">
            <div className="text-[10px] text-slate-500 uppercase">DATA PROVENANCE</div>
            <div className="text-2xl font-black text-amber-400 mt-1">4 Federal APIs</div>
            <div className="text-[11px] text-slate-400">Census, OSM, FEMA, EPA</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase">DECISION ENGINE</div>
            <div className="text-2xl font-black text-purple-400 mt-1">SHAP Trees</div>
            <div className="text-[11px] text-slate-400">Feature-Level Attribution</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-6 max-w-6xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-2">
            // WORKFLOW ENGINE
          </h2>
          <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            How TerraScorer Delivers Instant Site Conviction
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-8 rounded-3xl relative flex flex-col justify-between group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-lg flex items-center justify-center mb-6">
              01
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-2">Define Business Requirements</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mb-6">
                Input target unit economics: minimum 10-minute population density, footfall traffic targets, competitor proximity buffers, and strict flood-free tolerances.
              </p>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl font-mono text-[11px] text-emerald-400">
              ✓ Automated criteria calibration
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-8 rounded-3xl relative flex flex-col justify-between group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-bold text-lg flex items-center justify-center mb-6">
              02
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-2">Spatial AI & Hotspot Indexing</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mb-6">
                Our pipeline models 2,400+ Austin hexagons with spatial decay curves and Getis-Ord Gi* hotspot statistics to pinpoint high-velocity demand clusters.
              </p>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl font-mono text-[11px] text-cyan-400">
              ✓ Getis-Ord Gi* Z-Scores &gt; 1.96
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-8 rounded-3xl relative flex flex-col justify-between group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold text-lg flex items-center justify-center mb-6">
              03
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-2">Explain, Save & Benchmark</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mb-6">
                Understand why each site scores high via SHAP waterfall attribution, save top prospects to Instagram-style boards, and generate boardroom PDF dossiers.
              </p>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl font-mono text-[11px] text-purple-400">
              ✓ 1-Click PDF & CSV Investment Reports
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES SECTION */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-2">
            // PLATFORM CAPABILITIES
          </h2>
          <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Built for Commercial Expansion Leaders
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900/40 border border-slate-800/90 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
            <div className="text-2xl mb-3">📍</div>
            <h4 className="font-bold text-white text-base mb-2">Uber H3 Res-9 Hexagons</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equi-distant hexagonal spatial units that eliminate boundary distortion and model real-world catchment geometry.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/40 border border-slate-800/90 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
            <div className="text-2xl mb-3">🧠</div>
            <h4 className="font-bold text-white text-base mb-2">SHAP Decision Explainability</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent feature attribution displaying exact positive and negative drivers relative to the metro baseline score.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/40 border border-slate-800/90 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
            <div className="text-2xl mb-3">🔖</div>
            <h4 className="font-bold text-white text-base mb-2">Instagram-Style Collections</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bookmark sites into custom team boards, track status workflows, rent estimates, and team field comments.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/40 border border-slate-800/90 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
            <div className="text-2xl mb-3">🚗</div>
            <h4 className="font-bold text-white text-base mb-2">5/10/15-Min Isochrones</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time road network drive-time catchment polygons with reachable population calculation.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-slate-900/40 border border-slate-800/90 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
            <div className="text-2xl mb-3">⚖️</div>
            <h4 className="font-bold text-white text-base mb-2">Multi-Site Benchmark Matrix</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Side-by-side comparative matrix ranking candidate parcels with category winner badges and export options.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-slate-900/40 border border-slate-800/90 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
            <div className="text-2xl mb-3">🛡️</div>
            <h4 className="font-bold text-white text-base mb-2">FEMA & EPA Hazard Auditing</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatic penalty factoring for parcels situated in 100-year flood zones or high air pollution zones.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <section className="py-20 px-6 border-t border-slate-800 bg-slate-950/90 text-center relative z-10">
        <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
          Ready to Screen Austin Commercial Real Estate?
        </h3>
        <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8 font-sans">
          Join leading real estate developers and retail scouts using TerraScorer's spatial intelligence engine.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-sm font-black uppercase rounded-2xl shadow-xl shadow-emerald-500/25 transition-all cursor-pointer hover:scale-105"
          >
            Create Your Account &rarr;
          </button>
          <button
            onClick={() => setAuthView('login')}
            className="px-7 py-4 bg-slate-900 hover:bg-slate-800 text-white font-mono text-sm font-bold uppercase rounded-2xl border border-slate-700 transition-all cursor-pointer"
          >
            Sign In to Workspace
          </button>
        </div>

        <div className="mt-16 text-slate-600 text-xs font-mono">
          &copy; {new Date().getFullYear()} TerraScorer Spatial Intelligence Systems. Austin Metro Edition.
        </div>
      </section>
    </div>
  );
}
