import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { authenticateUser, DEMO_USERS } from '../utils/storage';

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
      if (result.success && result.user) login(result.user);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-emerald-100 selection:text-emerald-900">

      {/* ── HEADER — identical to TopBar & LandingPage header ─────────────── */}
      <header className="w-full h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between z-20 shadow-sm flex-shrink-0">
        <button
          onClick={() => setShowLandingPage(true)}
          className="flex items-center gap-3 cursor-pointer group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="font-sans font-black text-sm text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">TERRASCORER</div>
            <div className="font-mono text-[9px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">ENTERPRISE SPATIAL AI</div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLandingPage(true)}
            className="text-xs font-mono text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            ← Overview
          </button>
          <button
            onClick={() => setAuthView('register')}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-mono text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Register →
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* LEFT: Branding + 1-click demo cards */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[11px] font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="uppercase tracking-wide">Enterprise Spatial Intelligence Gateway</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
                Sign in to your Austin Spatial Command Center
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Access calibrated H3 Res-9 scoring grids, SHAP attribution trees, drive-time isochrones, and multi-site comparison matrices.
              </p>

              {/* 1-Click Demo Personas */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2 mb-1">
                  <span>⚡ 1-Click Demo Personas</span>
                  <span className="font-normal text-slate-400">(Instant Login)</span>
                </div>
                {DEMO_USERS.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handle1ClickDemo(demo)}
                    className="w-full text-left p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 font-mono font-bold flex items-center justify-center group-hover:scale-105 transition-transform text-sm">
                        {demo.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {demo.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {demo.role} · <span className="text-slate-400">{demo.organization}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700">
                      {demo.defaultPreset}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>🔒 256-Bit TLS Encryption</span>
              <span>Austin Metro Res-9</span>
            </div>
          </div>

          {/* RIGHT: Login form */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">Workspace Sign In</h2>
              <p className="text-xs text-slate-500">Enter your registered credentials to access the platform.</p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
                <span className="text-base">⚠️</span>
                <div className="flex-1 font-sans">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-mono font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  Corporate Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah.chen@apexretail.io"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 font-sans"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-mono font-bold uppercase text-[10px] tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-mono text-emerald-600 hover:text-emerald-700 cursor-pointer"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 font-sans"
                />
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-500">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-emerald-600" />
                  <span>Remember this terminal</span>
                </label>
                <span className="text-slate-400 font-mono text-[11px]">Default: password123</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-slate-900 hover:bg-black active:scale-[0.99] text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
              Need a new enterprise deployment?{' '}
              <button
                type="button"
                onClick={() => setAuthView('register')}
                className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 cursor-pointer font-mono"
              >
                Register Workspace →
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="w-full py-4 text-center text-[11px] text-slate-400 font-mono border-t border-slate-200 bg-white flex-shrink-0">
        © {new Date().getFullYear()} TerraScorer Spatial AI Systems · Austin Metro Edition
      </footer>
    </div>
  );
}
