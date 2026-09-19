import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { DEMO_USERS, type UserProfile } from '../utils/storage';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, currentUser, setCurrentUser } = useAppStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Director of Real Estate');
  const [defaultPreset, setDefaultPreset] = useState<'retail' | 'warehouse' | 'ev'>('retail');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name: name.trim() || 'Alex Mercer',
      email: email.trim() || 'alex.mercer@enterprise.com',
      role: role.trim() || 'Real Estate Strategy Lead',
      organization: organization.trim() || 'Horizon Expansion Capital',
      defaultPreset,
      targetMetro: 'Austin, TX',
    };
    setCurrentUser(newUser);
    setIsAuthModalOpen(false);
  };

  const handleSelectDemo = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔐</span>
            <h3 className="font-bold text-slate-900 text-sm uppercase font-mono">
              TERRASCORER ENTERPRISE ACCESS
            </h3>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-slate-400 hover:text-slate-800 font-mono text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors cursor-pointer text-center ${
              tab === 'login'
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors cursor-pointer text-center ${
              tab === 'register'
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/30'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register Workspace
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jessica Sterling"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-600 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Company / Organization:
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. BlueStar Capital Partners"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-600 font-sans"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1">
                Work Email:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-600 font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1">
                Password:
              </label>
              <input
                type="password"
                required
                defaultValue="••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-600 font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase rounded-lg shadow-sm transition-colors cursor-pointer mt-2"
            >
              {tab === 'login' ? 'Sign In to Workspace' : 'Create Enterprise Account'}
            </button>
          </form>

          {/* Instant 1-Click Demo Personas */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-2.5 text-center">
              ⚡ OR SELECT A 1-CLICK DEMO PERSONA:
            </div>
            <div className="space-y-2">
              {DEMO_USERS.map((demo) => {
                const isCurrent = currentUser?.id === demo.id;
                return (
                  <button
                    key={demo.id}
                    onClick={() => handleSelectDemo(demo)}
                    className={`w-full p-2.5 border rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{demo.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {demo.role} • {demo.organization}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                      {demo.defaultPreset}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
