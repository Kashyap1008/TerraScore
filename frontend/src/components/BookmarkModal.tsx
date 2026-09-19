import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { resolveLocationName } from '../utils/locationResolver';
import type { SiteStatus } from '../utils/storage';

export default function BookmarkModal() {
  const {
    bookmarkModalSite,
    setBookmarkModalSite,
    collections,
    addCollection,
    saveSiteToCollection,
    preset,
  } = useAppStore();

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || 'all');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [status, setStatus] = useState<SiteStatus>('prospect');
  const [notes, setNotes] = useState('');
  const [estimatedSqFt, setEstimatedSqFt] = useState<number>(4000);
  const [askingRent, setAskingRent] = useState<number>(65);

  if (!bookmarkModalSite) return null;

  const loc = resolveLocationName(
    bookmarkModalSite.lat,
    bookmarkModalSite.lon,
    bookmarkModalSite.h3
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let targetCollId = selectedCollectionId;

    if (isCreatingCollection && newCollectionName.trim()) {
      addCollection(newCollectionName.trim());
      targetCollId = `coll_${Date.now()}`;
    }

    saveSiteToCollection({
      h3: bookmarkModalSite.h3 || 'manual_h3',
      name: loc.name,
      submarket: loc.submarket,
      coordsFormatted: loc.coordsFormatted,
      lat: bookmarkModalSite.lat,
      lon: bookmarkModalSite.lon,
      score: bookmarkModalSite.score || 75,
      grade: bookmarkModalSite.grade || 'B+',
      preset: bookmarkModalSite.preset || preset,
      collectionId: targetCollId,
      status,
      notes,
      estimatedSqFt,
      askingRent,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-lg">🔖</span>
            <h3 className="font-bold text-slate-900 text-sm">SAVE SITE TO COLLECTION</h3>
          </div>
          <button
            onClick={() => setBookmarkModalSite(null)}
            className="text-slate-400 hover:text-slate-800 font-mono text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Site Preview Snippet */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-base">{loc.name}</div>
              <div className="text-xs text-emerald-700 font-mono font-medium">{loc.submarket}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{loc.coordsFormatted}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900 font-mono">
                {bookmarkModalSite.score || '—'}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                Suitability Score
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Collection Picker (Instagram Style) */}
          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-2">
              Select Collection / Board:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {collections.map((c) => {
                const isSelected = !isCreatingCollection && selectedCollectionId === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setSelectedCollectionId(c.id);
                      setIsCreatingCollection(false);
                    }}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate text-xs">{c.name}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCreatingCollection(true)}
                className={`p-2.5 rounded-lg border border-dashed flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isCreatingCollection
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                <span>+ New Board</span>
              </button>
            </div>

            {isCreatingCollection && (
              <div className="mt-2.5">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g. Austin Q4 Expansion, Drive-thru Candidates..."
                  className="w-full px-3 py-2 border border-emerald-500 rounded-lg text-xs focus:outline-emerald-600 font-sans"
                  autoFocus
                  required
                />
              </div>
            )}
          </div>

          {/* Workflow Status */}
          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1.5">
              Pipeline Stage:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['prospect', 'under_review', 'shortlisted', 'approved', 'rejected'] as SiteStatus[]).map(
                (st) => {
                  const isSelected = status === st;
                  const label = st.replace('_', ' ').toUpperCase();
                  return (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setStatus(st)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        isSelected
                          ? st === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : st === 'shortlisted'
                            ? 'bg-sky-600 text-white'
                            : st === 'rejected'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Investment & Space Assumptions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold text-[10px] uppercase mb-1">
                Estimated Area (SqFt):
              </label>
              <input
                type="number"
                value={estimatedSqFt}
                onChange={(e) => setEstimatedSqFt(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold text-[10px] uppercase mb-1">
                Target Rent ($/sqft/yr):
              </label>
              <input
                type="number"
                value={askingRent}
                onChange={(e) => setAskingRent(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:border-slate-400"
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] tracking-wider mb-1">
              Field Notes & Comments:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Corner lot frontage, traffic light access, landlord contact info..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-sans focus:outline-emerald-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBookmarkModalSite(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>💾 Save to Portfolio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
