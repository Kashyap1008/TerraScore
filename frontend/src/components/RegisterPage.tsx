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

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid corporate work email address.');
      return;
    }
    if (!organization.trim()) {
      setErrorMessage('Please enter your company or organization name.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your confirm password field.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('You must accept the Enterprise Data Terms to create a workspace.');
      return;
    }

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
            onClick={() => setAuthView('login')}
            className="px-4 py-2 border border-slate-700 hover:border-slate-500 text-white font-mono text-xs font-bold uppercase rounded-xl transition-all cursor-pointer bg-slate-900/80"
          >
            Sign In &rarr;
          </button>
        </div>
      </header>

      {/* MAIN REGISTRATION CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex items-center justify-center relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* LEFT COLUMN: ENTERPRISE CAPABILITIES & TRUST BADGES */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-mono text-xs mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>COMMERCIAL REAL ESTATE WORKSPACE</span>
              </div>

              <h1 className="text-3xl font-black text-white tracking-tight mb-4 leading-tight">
                Deterministic Siting for Modern Expansion Teams
              </h1>

              <p className="text-xs text-slate-400 leading-relaxed font-sans mb-8">
                Join forward-thinking retailers, warehouse operators, and EV infrastructure developers screening Austin commercial parcels in seconds.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: '📍',
                    title: '2,400+ Austin H3 Res-9 Cells',
                    desc: 'Standardized ~100m radius hexagons with demographic & road proximity.',
                  },
                  {
                    icon: '🧠',
                    title: 'Transparent SHAP Decision Trees',
                    desc: 'Exact positive and negative feature attribution for investment committees.',
                  },
                  {
                    icon: '🚗',
                    title: '<45ms Multi-Modal Isochrones',
                    desc: 'Real road network drive-time catchments backed by OSRM routing.',
                  },
                  {
                    icon: '🛡️',
                    title: 'FEMA & EPA Hazard Audits',
                    desc: 'Automatic penalty deductions for 100-year flood zones and air pollution.',
                  },
                ].map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-start gap-3"
                  >
                    <span className="text-lg">{feat.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{feat.title}</div>
                      <div className="text-[11px] text-slate-400 leading-snug font-sans mt-0.5">
                        {feat.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-500 font-mono flex items-center justify-between">
              <span>✓ Instant Access</span>
              <span>Austin Metro Pilot</span>
            </div>
          </div>

          {/* RIGHT COLUMN: EXPANDED REGISTRATION FORM */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 md:p-10 backdrop-blur-md shadow-2xl flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                Create Enterprise Account
              </h2>
              <p className="text-xs text-slate-400">
                Configure your workspace profile, security credentials, and industry archetype.
              </p>
            </div>

            {/* ERROR BANNER */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in duration-200">
                <span className="text-base">⚠️</span>
                <div className="flex-1 font-sans">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-mono font-bold uppercase text-[10px] tracking-wider mb-1.5">
                    Full Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jessica Sterling"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-mono font-bold uppercase text-[10px] tracking-wider mb-1.5">
                    Corporate Work Email <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="j.sterling@company.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-mono font-bold uppercase text-[10px] tracking-wider mb-1.5">
                    Company / Organization <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. BlueStar Capital Partners"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-mono font-bold uppercase text-[10px] tracking-wider mb-1.5">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Director of Real Estate"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-mono font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  Primary Expansion Archetype
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'retail', label: 'Retail Store', icon: '🛍️' },
                    { id: 'warehouse', label: 'Logistics Depot', icon: '📦' },
                    { id: 'ev', label: 'EV Fast Charging', icon: '⚡' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setDefaultPreset(item.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        defaultPreset === item.id
                          ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-base mb-0.5">{item.icon}</div>
                      <div className="text-[11px] font-mono">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* PASSWORD AND CONFIRM PASSWORD FIELDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-mono font-bold uppercase text-[10px] tracking-wider">
                      Create Password <span className="text-emerald-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-mono font-bold uppercase text-[10px] tracking-wider">
                      Confirm Password <span className="text-emerald-400">*</span>
                    </label>
                    {confirmPassword && (
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          password === confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {password === confirmPassword ? '✓ Matches' : '✗ Mismatch'}
                      </span>
                    )}
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-white text-xs focus:outline-none transition-colors font-sans ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-rose-500/70 focus:border-rose-500'
                        : 'border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-slate-400 text-xs">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-500 accent-emerald-500"
                  />
                  <span>
                    I acknowledge that scoring outputs are generated by TerraScorer spatial models for Austin, TX.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <span>Initializing Enterprise Workspace...</span>
                ) : (
                  <>
                    <span>Create Account & Launch Platform</span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
              Already have an enterprise account?{' '}
              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer font-mono"
              >
                Sign In &rarr;
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
