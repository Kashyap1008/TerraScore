import PresetSelector from './PresetSelector';
import { useAppStore, type AppView } from '../store/useAppStore';

export default function TopBar() {
  const {
    currentView,
    setCurrentView,
    compareList,
    savedSites,
    currentUser,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    setShowLandingPage,
  } = useAppStore();

  const navItems: { id: AppView; label: string; icon: string; badge?: number }[] = [
    { id: 'explorer', label: 'EXPLORER', icon: '🗺️' },
    { id: 'requirements', label: 'REQUIREMENTS', icon: '📋' },
    { id: 'collections', label: 'SAVED SITES', icon: '🔖', badge: savedSites.length },
    { id: 'compare', label: 'COMPARE', icon: '⚖️', badge: compareList.length },
    { id: 'methodology', label: 'METHODOLOGY', icon: 'ℹ️' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 flex items-center justify-between px-5 select-none shadow-xs font-sans">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentView('explorer')}
          className="flex items-center gap-2.5 cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-xs">
            <svg
              width="18"
              height="18"
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
            <div className="font-sans font-black text-sm text-slate-900 tracking-tight leading-none">
              TERRASCORER
            </div>
            <div className="font-mono text-[9px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">
              ENTERPRISE SPATIAL AI
            </div>
          </div>
        </button>

        <span className="font-mono uppercase tracking-widest text-[10px] text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md ml-2 hidden xl:inline-block">
          📍 AUSTIN, TX
        </span>

        <button
          onClick={() => setShowLandingPage(true)}
          className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg font-mono transition-colors cursor-pointer ml-1 hidden sm:inline-block"
          title="Return to Landing Page"
        >
          🏠 Landing Page
        </button>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`font-mono text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Preset Selector & User Profile */}
      <div className="flex items-center gap-3">
        {currentView === 'explorer' && (
          <div>
            <PresetSelector />
          </div>
        )}

        {/* User Account / Workspace Pill */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 pl-2 pr-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs text-left"
              title="Workspace Profile Settings"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono leading-none truncate max-w-[110px]">
                  {currentUser.organization}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-mono text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>🔐 Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
