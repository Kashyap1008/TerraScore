import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { UserProfile } from '../utils/storage';

export default function ProfileSettings() {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    currentUser,
    setCurrentUser,
    logout,
  } = useAppStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [organization, setOrganization] = useState(currentUser?.organization || '');
  const [role, setRole] = useState(currentUser?.role || '');
  const targetMetro = currentUser?.targetMetro || 'Austin, TX';
  const [defaultPreset, setDefaultPreset] = useState(currentUser?.defaultPreset || 'retail');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isProfileModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      name,
      organization,
      role,
      targetMetro,
      defaultPreset,
    };
    setCurrentUser(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsProfileModalOpen(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <h3 className="font-bold text-slate-900 text-sm uppercase font-mono">
              USER PROFILE & WORKSPACE SETTINGS
            </h3>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="text-slate-400 hover:text-slate-800 font-mono text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1">
              Full Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-600 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1">
              Company / Organization:
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-600 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1">
              Professional Role:
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-600 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1">
                Target Metro:
              </label>
              <input
                type="text"
                disabled
                value={targetMetro}
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1">
                Default Industry:
              </label>
              <select
                value={defaultPreset}
                onChange={(e) => setDefaultPreset(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-600 font-mono uppercase bg-white cursor-pointer"
              >
                <option value="retail">Retail Store</option>
                <option value="warehouse">Logistics Depot</option>
                <option value="ev">EV Fast Hub</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsProfileModalOpen(false);
                logout();
              }}
              className="text-rose-600 hover:text-rose-700 font-mono text-xs font-bold cursor-pointer hover:underline"
            >
              🚪 Sign Out & Exit
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-mono text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {savedSuccess ? '✓ Settings Saved' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
