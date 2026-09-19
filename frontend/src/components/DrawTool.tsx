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
        className={`font-mono text-xs uppercase px-3 py-1.5 rounded-md border transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ${
          drawing
            ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-md animate-pulse'
            : 'bg-white/95 backdrop-blur text-sky-700 border-sky-300 hover:bg-sky-50 hover:border-sky-400 font-medium'
        }`}
      >
        <span>{drawing ? `DRAWING (${vertexCount}/3)` : 'DRAW ZONE'}</span>
        {drawing && (
          <span className="text-[10px] opacity-90 font-normal ml-1">
            [ESC TO CANCEL]
          </span>
        )}
      </button>

      {hasPolygon && (
        <button
          type="button"
          onClick={onClearPolygon}
          className="bg-white/95 backdrop-blur text-rose-600 border border-rose-300 hover:bg-rose-50 hover:text-rose-700 font-mono text-xs uppercase px-2.5 py-1.5 rounded-md shadow-sm transition-colors cursor-pointer font-medium"
        >
          CLEAR
        </button>
      )}
    </div>
  );
}
