import PresetSelector from './PresetSelector';
import { useAppStore } from '../store/useAppStore';

export default function TopBar() {
  const { compareList } = useAppStore();
  
  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-panel/80 backdrop-blur border-b border-panelEdge z-30 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 21 16z"></path>
        </svg>
        <span className="font-mono uppercase tracking-widest text-xs text-slate-900 font-bold">SITE_READINESS</span>
        <span className="font-mono uppercase tracking-widest text-[10px] text-slate-500 ml-4 border border-slate-200 px-2 py-0.5 rounded-xs">// AUSTIN, TX</span>
      </div>
      
      <div>
        <PresetSelector />
      </div>
      
      <div className="flex gap-2">
        <button onClick={() => window.print()} className="bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white font-mono text-xs uppercase px-3 py-1.5 rounded-md transition-colors cursor-pointer font-semibold shadow-xs">
          EXPORT
        </button>
        <button className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-mono text-xs uppercase px-3 py-1.5 rounded-md transition-colors cursor-pointer font-semibold shadow-xs">
          COMPARE ({compareList.length})
        </button>
      </div>
    </div>
  );
}
