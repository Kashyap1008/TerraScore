import { H3HexagonLayer } from '@deck.gl/geo-layers';

export interface HexLayerOpts {
  data: GeoJSON.FeatureCollection;
  opacity?: number;
  onHover?: (info: unknown) => void;
  onClick?: (info: unknown) => void;
}

function getHexColor(score: number | null | undefined): [number, number, number, number] {
  if (score == null) return [0, 0, 0, 0];
  if (score >= 80) return [204, 255, 0, 140]; // neonGreen
  if (score >= 60) return [0, 229, 255, 140]; // neonCyan
  if (score >= 40) return [255, 170, 0, 140]; // amber
  return [255, 0, 255, 140]; // neonMagenta
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
    getLineColor: [0, 229, 255, 80],
    lineWidthMinPixels: 1,
    getElevation: 0,
    opacity: opts.opacity ?? 1,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 80],
    onHover: opts.onHover,
    onClick: opts.onClick,
  });
}
