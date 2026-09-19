import { H3HexagonLayer } from '@deck.gl/geo-layers';

export interface HexLayerOpts {
  data: GeoJSON.FeatureCollection;
  opacity?: number;
  onHover?: (info: unknown) => void;
  onClick?: (info: unknown) => void;
}

function getHexColor(score: number | null | undefined): [number, number, number, number] {
  if (score == null) return [0, 0, 0, 0];
  if (score >= 80) return [16, 185, 129, 105]; // Semi-transparent Emerald Green
  if (score >= 60) return [6, 182, 212, 100];  // Semi-transparent Sky Cyan
  if (score >= 40) return [245, 158, 11, 95];   // Semi-transparent Warm Amber
  return [239, 68, 68, 90];                     // Semi-transparent Coral Rose
}

export function createHexLayer(opts: HexLayerOpts) {
  return new H3HexagonLayer({
    id: 'h3-hex-layer',
    data: opts.data.features,
    pickable: true,
    wireframe: false,
    filled: true,
    extruded: false,
    stroked: true,
    getHexagon: (d: unknown) => {
      const feat = d as GeoJSON.Feature;
      return (feat.properties as { h3?: string })?.h3 ?? '';
    },
    getFillColor: (d: unknown) => {
      const feat = d as GeoJSON.Feature;
      const score = (feat.properties as { score?: number })?.score;
      return getHexColor(score);
    },
    getLineColor: [255, 255, 255, 230],
    lineWidthMinPixels: 1.5,
    getElevation: 0,
    opacity: opts.opacity ?? 1,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 140],
    onHover: opts.onHover,
    onClick: opts.onClick,
  });
}
