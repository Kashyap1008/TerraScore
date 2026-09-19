import PresetSelector from './PresetSelector';
import { useAppStore } from '../store/useAppStore';

export default function TopBar() {
  const { compareList } = useAppStore();
  
  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-panel/80 backdrop-blur border-b border-panelEdge z-30 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 21 16z"></path>
        </svg>
        <span className="font-mono uppercase tracking-widest text-xs text-white">SITE_READINESS</span>
      </div>
      
      <div>
        <PresetSelector />
      </div>
      
      <div className="flex gap-2">
        <button onClick={() => window.print()} className="bg-transparent border border-neonGreen text-neonGreen hover:bg-neonGreen hover:text-black font-mono text-xs uppercase px-3 py-1.5 rounded-sm transition-colors cursor-pointer">
          EXPORT
        </button>
        <button className="bg-transparent border border-neonGreen text-neonGreen hover:bg-neonGreen hover:text-black font-mono text-xs uppercase px-3 py-1.5 rounded-sm transition-colors cursor-pointer">
          COMPARE ({compareList.length})
        </button>
      </div>
    </div>
  );
}
