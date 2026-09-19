import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { UserProfile } from '../utils/storage';

export default function OnboardingWizard() {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    setCurrentUser,
    setShowLandingPage,
    setCurrentView,
    setPreset,
  } = useAppStore();

  const [step, setStep] = useState<number>(1);

  // Step 1: User Profile Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Director of Real Estate');

  // Step 2: Expansion Requirements Form
  const [industry, setIndustry] = useState<'retail' | 'warehouse' | 'ev'>('retail');
  const [minPopulation, setMinPopulation] = useState<number>(35000);
  const [transitPriority, setTransitPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [competitorStrategy, setCompetitorStrategy] = useState<'balanced' | 'aggressive' | 'avoid'>('balanced');
  const [zeroFloodRisk, setZeroFloodRisk] = useState<boolean>(true);

  if (!isOnboardingOpen) return null;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!name.trim() || !email.trim() || !organization.trim()) return;
      setStep(2);
    } else if (step === 2) {
      // Complete Onboarding & Launch Platform
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: name.trim() || 'Alex Mercer',
        email: email.trim(),
        role: role.trim() || 'Real Estate Strategy Lead',
        organization: organization.trim() || 'Enterprise Partners',
        defaultPreset: industry,
        targetMetro: 'Austin, TX',
      };

      setCurrentUser(newUser);
      setPreset(industry);
      setIsOnboardingOpen(false);
      setShowLandingPage(false);
      setCurrentView('explorer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Step Indicator */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase text-emerald-700 tracking-wider">
              ENTERPRISE ONBOARDING WIZARD // STEP {step} OF 2
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {step === 1 ? '1. Your Professional Identity' : '2. Expansion & Site Requirements'}
            </h3>
          </div>
          <button
            onClick={() => setIsOnboardingOpen(false)}
            className="text-slate-400 hover:text-slate-800 font-mono text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Form Body */}
        <form onSubmit={handleNextStep} className="p-8 space-y-4 text-xs">
          {step === 1 ? (
            /* STEP 1: USER & ORGANIZATION INFO */
            <>
              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jessica Sterling"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-sans"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  Work Email:
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="j.sterling@bluestar.com"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  Company / Organization Name:
                </label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. BlueStar Capital Partners"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  Your Role / Title:
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Director of Real Estate Expansion"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 font-sans"
                />
              </div>
            </>
          ) : (
            /* STEP 2: BUSINESS & SITE REQUIREMENTS */
            <>
              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  Target Business Archetype:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'retail', label: 'Retail Store', icon: '🛍️' },
                    { id: 'warehouse', label: 'Logistics Hub', icon: '📦' },
                    { id: 'ev', label: 'EV Fast Charging', icon: '⚡' },
                  ].map((ind) => (
                    <button
                      type="button"
                      key={ind.id}
                      onClick={() => setIndustry(ind.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        industry === ind.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-base mb-1">{ind.icon}</div>
                      <div className="text-xs">{ind.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    Min 10-Min Catchment Population:
                  </label>
                  <span className="font-mono font-bold text-emerald-700">
                    {minPopulation.toLocaleString()} residents
                  </span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="80000"
                  step="5000"
                  value={minPopulation}
                  onChange={(e) => setMinPopulation(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  Transit & Arterial Road Density Priority:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['high', 'medium', 'low'] as const).map((pri) => (
                    <button
                      type="button"
                      key={pri}
                      onClick={() => setTransitPriority(pri)}
                      className={`py-2 rounded-lg border text-center font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        transitPriority === pri
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pri} Priority
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  Competitor Proximity Strategy:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'aggressive', label: 'Aggressive Cluster' },
                    { id: 'avoid', label: 'Underserved Only' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setCompetitorStrategy(item.id as any)}
                      className={`py-2 px-1 rounded-lg border text-center font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        competitorStrategy === item.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={zeroFloodRisk}
                    onChange={(e) => setZeroFloodRisk(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                  />
                  <span className="font-semibold text-slate-700 text-xs">
                    Strict Zero FEMA Flood Risk Buffer Required
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Action Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                &larr; Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{step === 1 ? 'Next: Set Requirements →' : '🚀 Launch Spatial Platform'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
