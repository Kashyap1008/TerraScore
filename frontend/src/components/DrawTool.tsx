import { useEffect } from 'react';

export interface DrawToolProps {
  onPolygonDraw: (geojson: GeoJSON.Polygon) => void;
  drawing: boolean;
  onToggleDrawing: () => void;
  hasPolygon: boolean;
  onClearPolygon: () => void;
  vertexCount?: number;
}

export default function DrawTool({
  drawing,
  onToggleDrawing,
  hasPolygon,
  onClearPolygon,
  vertexCount = 0,
}: DrawToolProps) {
  useEffect(() => {
    if (!drawing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onToggleDrawing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawing, onToggleDrawing]);

  return (
    <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 select-none">
      <button
        type="button"
        onClick={onToggleDrawing}
        className={`font-mono text-xs uppercase px-3 py-1.5 rounded-sm border transition-colors cursor-pointer shadow-md flex items-center gap-1.5 ${
          drawing
            ? 'bg-neonCyan text-black border-neonCyan font-bold animate-pulse'
            : 'bg-panel/85 backdrop-blur text-neonCyan border-neonCyan hover:bg-neonCyan hover:text-black'
        }`}
      >
        <span>{drawing ? `DRAWING (${vertexCount}/3)` : 'DRAW_ZONE'}</span>
        {drawing && (
          <span className="text-[10px] opacity-80 font-normal">
            [ESC TO CANCEL]
          </span>
        )}
      </button>

      {hasPolygon && (
        <button
          type="button"
          onClick={onClearPolygon}
          className="bg-panel/85 backdrop-blur text-neonMagenta border border-neonMagenta hover:bg-neonMagenta hover:text-black font-mono text-xs uppercase px-2.5 py-1.5 rounded-sm transition-colors cursor-pointer"
        >
          CLEAR
        </button>
      )}
    </div>
  );
}
