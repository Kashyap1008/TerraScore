import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { registerAccount } from '../utils/storage';

export default function RegisterPage() {
  const { setAuthView, setShowLandingPage, login, setPreset } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Director of Real Estate');
  const [defaultPreset, setDefaultPreset] = useState<'retail' | 'warehouse' | 'ev'>('retail');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) { setErrorMessage('Please enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { setErrorMessage('Please enter a valid corporate work email address.'); return; }
    if (!organization.trim()) { setErrorMessage('Please enter your company or organization name.'); return; }
    if (password.length < 6) { setErrorMessage('Password must be at least 6 characters long.'); return; }
    if (password !== confirmPassword) { setErrorMessage('Passwords do not match. Please verify your confirm password field.'); return; }
    if (!agreeTerms) { setErrorMessage('You must accept the Enterprise Data Terms to create a workspace.'); return; }

    setIsLoading(true);
    setTimeout(() => {
      const result = registerAccount({
        name: name.trim(),
        email: email.trim(),
        password,
        organization: organization.trim(),
        role: role.trim() || 'Real Estate Strategy Lead',
        defaultPreset,
        targetMetro: 'Austin, TX',
      });
      setIsLoading(false);
      if (result.success && result.user) {
        setPreset(defaultPreset);
        login(result.user);
      } else {
        setErrorMessage(result.error || 'Failed to register account.');
      }
    }, 200);
  };

  const FEATURES = [
    { icon: '📍', title: '2,400+ Austin H3 Res-9 Cells', desc: 'Standardized ~100m radius hexagons with demographic & road proximity scoring.' },
    { icon: '🧠', title: 'Transparent SHAP Decision Trees', desc: 'Exact positive and negative feature attribution for investment committees.' },
    { icon: '🚗', title: '<45ms Drive-Time Isochrones', desc: 'Real road network catchments backed by geometric routing engine.' },
    { icon: '🛡️', title: 'FEMA & EPA Hazard Audits', desc: 'Automatic penalty deductions for 100-year flood zones and air pollution.' },
  ];

  const PRESETS = [
    { id: 'retail', label: 'Retail Store', icon: '🛍️' },
    { id: 'warehouse', label: 'Logistics Depot', icon: '📦' },
    { id: 'ev', label: 'EV Fast Charging', icon: '⚡' },
  ];

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 font-sans";
  const labelClass = "block text-slate-700 font-mono font-bold uppercase text-[10px] tracking-wider mb-1.5";

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
            onClick={() => setAuthView('login')}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-mono text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Sign In →
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex items-start justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT: Enterprise capabilities */}
          <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-2xl p-8 shadow-sm sticky top-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[11px] font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="uppercase tracking-wide">Commercial Real Estate Workspace</span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
              Deterministic Siting for Modern Expansion Teams
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed mb-7">
              Join forward-thinking retailers, warehouse operators, and EV developers screening Austin commercial parcels in seconds.
            </p>

            <div className="space-y-3">
              {FEATURES.map((f, i) => (
                <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{f.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{f.title}</div>
                    <div className="text-[11px] text-slate-500 leading-snug font-sans mt-0.5">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 pt-5 border-t border-slate-100 text-xs text-slate-400 font-mono flex items-center justify-between">
              <span>✓ Instant Access</span>
              <span>Austin Metro Pilot</span>
            </div>
          </div>

          {/* RIGHT: Registration form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">Create Enterprise Account</h2>
              <p className="text-xs text-slate-500">Configure your workspace profile, security credentials, and industry archetype.</p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
                <span className="text-base flex-shrink-0">⚠️</span>
                <div className="flex-1 font-sans">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Row 1: Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name <span className="text-emerald-600">*</span></label>
                  <input
                    type="text" required value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jessica Sterling"
                    className={inputClass} autoFocus
                  />
                </div>
                <div>
                  <label className={labelClass}>Corporate Work Email <span className="text-emerald-600">*</span></label>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="j.sterling@company.com"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Row 2: Org + Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Company / Organization <span className="text-emerald-600">*</span></label>
                  <input
                    type="text" required value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. BlueStar Capital Partners"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Job Title / Role</label>
                  <input
                    type="text" value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Director of Real Estate"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Expansion Archetype */}
              <div>
                <label className={labelClass}>Primary Expansion Archetype</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((item) => (
                    <button
                      type="button" key={item.id}
                      onClick={() => setDefaultPreset(item.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        defaultPreset === item.id
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="text-xl mb-1">{item.icon}</div>
                      <div className="text-[11px] font-mono font-bold">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-mono font-bold uppercase text-[10px] tracking-wider">
                      Create Password <span className="text-emerald-600">*</span>
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
                    type={showPassword ? 'text' : 'password'} required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={inputClass}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-mono font-bold uppercase text-[10px] tracking-wider">
                      Confirm Password <span className="text-emerald-600">*</span>
                    </label>
                    {confirmPassword && (
                      <span className={`text-[10px] font-mono font-bold ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                        {password === confirmPassword ? '✓ Matches' : '✗ Mismatch'}
                      </span>
                    )}
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 font-sans ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-slate-500 text-xs">
                  <input
                    type="checkbox" checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded accent-emerald-600 flex-shrink-0"
                  />
                  <span>I acknowledge that scoring outputs are generated by TerraScorer spatial models for Austin, TX.</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-slate-900 hover:bg-black active:scale-[0.99] text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Initializing Workspace...</span>
                ) : (
                  <>
                    <span>Create Account & Launch Platform</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
              Already have an enterprise account?{' '}
              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 cursor-pointer font-mono"
              >
                Sign In →
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="w-full py-4 text-center text-[11px] text-slate-400 font-mono border-t border-slate-200 bg-white flex-shrink-0 mt-6">
        © {new Date().getFullYear()} TerraScorer Spatial AI Systems · Austin Metro Edition
      </footer>
    </div>
  );
}
