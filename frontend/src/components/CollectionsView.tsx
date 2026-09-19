import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { SavedSite } from '../utils/storage';

export default function CollectionsView() {
  const {
    collections,
    savedSites,
    removeSavedSite,
    setCurrentView,
    setSelectedSite,
    setFlyTo,
    addToCompare,
  } = useAppStore();

  const [activeCollectionId, setActiveCollectionId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filtered sites
  const filteredSites = useMemo(() => {
    return savedSites.filter((site) => {
      const matchesCollection =
        activeCollectionId === 'all' || site.collectionId === activeCollectionId;
      const matchesStatus =
        statusFilter === 'all' || site.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.submarket.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCollection && matchesStatus && matchesSearch;
    });
  }, [savedSites, activeCollectionId, statusFilter, searchQuery]);

  const handleFlyToSite = (site: SavedSite) => {
    setSelectedSite({ lat: site.lat, lon: site.lon });
    setFlyTo({ lat: site.lat, lon: site.lon, zoom: 15 });
    setCurrentView('explorer');
  };

  const exportCsv = () => {
    const headers = ['Name', 'Submarket', 'Score', 'Grade', 'Status', 'Estimated SqFt', 'Target Rent ($/sqft)', 'Lat', 'Lon', 'Notes'];
    const rows = filteredSites.map((s) => [
      `"${s.name}"`,
      `"${s.submarket}"`,
      s.score,
      s.grade,
      s.status,
      s.estimatedSqFt || '',
      s.askingRent || '',
      s.lat,
      s.lon,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `terrascorer_saved_sites_${activeCollectionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pt-20 pb-16 px-6 max-w-7xl mx-auto font-sans min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔖</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              SAVED SITES & PORTFOLIO BOARDS
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            MANAGE SHORTLISTED CANDIDATE LOCATIONS, INVESTMENT NOTES & WORKFLOW PIPELINES
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={filteredSites.length === 0}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-mono text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            📥 EXPORT CSV
          </button>
          <button
            onClick={() => setCurrentView('explorer')}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>🗺️ MAP EXPLORER</span>
          </button>
        </div>
      </div>

      {/* Collection Boards Selector (Instagram Style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 select-none [&::-webkit-scrollbar]:hidden">
        {collections.map((coll) => {
          const isSelected = activeCollectionId === coll.id;
          const count = savedSites.filter((s) => coll.id === 'all' || s.collectionId === coll.id).length;
          return (
            <button
              key={coll.id}
              onClick={() => setActiveCollectionId(coll.id)}
              className={`px-4 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 shrink-0 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 font-medium'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: coll.color }}
              />
              <span className="text-xs">{coll.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Status Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <span className="text-slate-400 text-sm pl-2">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by neighborhood name, submarket, or notes..."
            className="w-full text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Status:</span>
          {(['all', 'shortlisted', 'approved', 'under_review', 'prospect'] as string[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* View Toggle */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-900 text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title="Table View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredSites.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="text-4xl mb-3">📂</div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No saved sites found in this view</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 font-mono">
            Explore the map, click on promising hexagons, and click the Bookmark 🔖 icon to add candidates to this board.
          </p>
          <button
            onClick={() => setCurrentView('explorer')}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            OPEN MAP EXPLORER
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header with status tag and score */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      site.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : site.status === 'shortlisted'
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : site.status === 'under_review'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {site.status.replace('_', ' ')}
                  </span>

                  <div className="flex items-baseline gap-1 font-mono">
                    <span
                      className="text-2xl font-black"
                      style={{
                        color:
                          site.score >= 80
                            ? '#059669'
                            : site.score >= 60
                            ? '#0284C7'
                            : site.score >= 40
                            ? '#D97706'
                            : '#DC2626',
                      }}
                    >
                      {site.score}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">/ 100</span>
                  </div>
                </div>

                {/* Location Title */}
                <h3 className="font-bold text-slate-900 text-base leading-tight mb-1 flex items-center gap-1.5">
                  <span className="text-emerald-600 text-sm">📍</span>
                  <span>{site.name}</span>
                </h3>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-3">
                  <span className="text-emerald-700 font-semibold">{site.submarket}</span>
                  <span>{site.coordsFormatted}</span>
                </div>

                {/* Financial & Space Stats */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 text-xs">
                  <div>
                    <div className="text-[9px] uppercase font-mono font-semibold text-slate-400">Target Area</div>
                    <div className="font-bold text-slate-800 font-mono">
                      {site.estimatedSqFt ? `${site.estimatedSqFt.toLocaleString()} sqft` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-mono font-semibold text-slate-400">Target Rent</div>
                    <div className="font-bold text-slate-800 font-mono">
                      {site.askingRent ? `$${site.askingRent}/sqft` : '—'}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {site.notes && (
                  <p className="text-xs text-slate-600 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg mb-4 italic leading-relaxed">
                    "{site.notes}"
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => addToCompare({ lat: site.lat, lon: site.lon })}
                  className="px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg font-mono text-[10px] uppercase font-bold transition-colors cursor-pointer"
                >
                  + Compare
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => removeSavedSite(site.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete site"
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => handleFlyToSite(site)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>View Map &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] uppercase text-slate-500">
              <tr>
                <th className="py-3 px-4">Location Name</th>
                <th className="py-3 px-4">Submarket</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Est. SqFt</th>
                <th className="py-3 px-4">Target Rent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="text-emerald-600">📍</span>
                    <span>{site.name}</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-700 font-mono font-medium">{site.submarket}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{site.score} / 100</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-slate-100 text-slate-700">
                      {site.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {site.estimatedSqFt ? `${site.estimatedSqFt.toLocaleString()} sqft` : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {site.askingRent ? `$${site.askingRent}/sqft` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleFlyToSite(site)}
                      className="px-2.5 py-1 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded-md hover:bg-emerald-700 cursor-pointer"
                    >
                      Fly To
                    </button>
                    <button
                      onClick={() => removeSavedSite(site.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
