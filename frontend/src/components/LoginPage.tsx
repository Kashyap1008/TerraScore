import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { authenticateUser, DEMO_USERS, type UserProfile } from '../utils/storage';

export default function LoginPage() {
  const { setAuthView, setShowLandingPage, login } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const result = authenticateUser(email, password);
      setIsLoading(false);

      if (result.success && result.user) {
        login(result.user);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      }
    }, 200);
  };

  const handle1ClickDemo = (demo: typeof DEMO_USERS[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const result = authenticateUser(demo.email, demo.password);
      setIsLoading(false);
      if (result.success && result.user) {
        login(result.user);
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      {/* BACKGROUND GLOWS & GRID */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* TOP BAR */}
      <header className="w-full h-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 md:px-12 flex items-center justify-between relative z-20">
        <button
          onClick={() => setShowLandingPage(true)}
          className="flex items-center gap-3 cursor-pointer group text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/50 group-hover:border-emerald-500 transition-colors">
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
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLandingPage(true)}
            className="text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Overview
          </button>
          <button
            onClick={() => setAuthView('register')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold uppercase rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
          >
            Register Workspace &rarr;
          </button>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT VIEW */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex items-center justify-center relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* LEFT COLUMN: BRANDING & 1-CLICK DEMO CARDS */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-mono text-xs mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ENTERPRISE SPATIAL INTELLIGENCE GATEWAY</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4 leading-tight">
                Sign in to your Austin Spatial Command Center
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed font-sans mb-8">
                Access calibrated H3 Res-9 scoring grids, SHAP attribution trees, drive-time isochrones, and multi-site comparison matrices.
              </p>

              {/* Instant 1-Click Demo Personas */}
              <div className="space-y-3">
                <div className="text-[11px] font-mono font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                  <span>⚡ 1-CLICK HACKATHON DEMO PERSONAS</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Instant Login)</span>
                </div>

                {DEMO_USERS.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handle1ClickDemo(demo)}
                    className="w-full text-left p-3.5 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center group-hover:scale-105 transition-transform">
                        {demo.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {demo.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {demo.role} • <span className="text-slate-500">{demo.organization}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-emerald-400">
                      {demo.defaultPreset}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>🔒 256-Bit TLS Encryption</span>
              <span>Austin Metro Res-9 Tessellation</span>
            </div>
          </div>

          {/* RIGHT COLUMN: EXPANDED LOGIN FORM */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 md:p-10 backdrop-blur-md shadow-2xl flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                Workspace Sign In
              </h2>
              <p className="text-xs text-slate-400">
                Enter your registered corporate credentials to access the live terminal.
              </p>
            </div>

            {/* ERROR BANNER */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in duration-200">
                <span className="text-base">⚠️</span>
                <div className="flex-1 font-sans">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-mono font-bold uppercase text-[11px] tracking-wider mb-2">
                  Corporate Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah.chen@apexretail.io"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 font-sans"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 font-mono font-bold uppercase text-[11px] tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-mono text-emerald-400 hover:underline cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 font-sans"
                />
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                  />
                  <span>Remember this terminal</span>
                </label>
                <span className="text-slate-500 font-mono text-[11px]">Default: password123</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <span>Authenticating Terminal...</span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
              Need a new enterprise deployment?{' '}
              <button
                type="button"
                onClick={() => setAuthView('register')}
                className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer font-mono"
              >
                Register Workspace &rarr;
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-4 text-center text-xs text-slate-600 font-mono relative z-10 border-t border-slate-900">
        &copy; {new Date().getFullYear()} TerraScorer Spatial AI Systems • Austin Metro Edition
      </footer>
    </div>
  );
}
