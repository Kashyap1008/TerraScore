import React from 'react';
import { useAppStore } from '../store/useAppStore';

export default function PresetSelector() {
  const { preset, setPreset } = useAppStore();
  return (
    <div className="flex items-center gap-2">
      <span className="text-textMuted font-mono text-xs">&gt; PRESET:</span>
      <select 
        value={preset} 
        onChange={(e) => setPreset(e.target.value as 'retail'|'warehouse'|'ev')}
        className="bg-panel border border-panelEdge text-neonCyan font-mono text-xs uppercase px-3 py-1.5 outline-none"
      >
        <option value="retail">RETAIL_STORE</option>
        <option value="warehouse">WAREHOUSE</option>
        <option value="ev">EV_CHARGING</option>
      </select>
    </div>
  );
}
