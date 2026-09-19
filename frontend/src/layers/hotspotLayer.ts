import { H3HexagonLayer } from '@deck.gl/geo-layers';

export interface HotspotLayerOpts {
  data: GeoJSON.FeatureCollection | GeoJSON.Feature[];
  opacity?: number;
  onHover?: (info: unknown) => void;
  onClick?: (info: unknown) => void;
}

export function createHotspotLayer(opts: HotspotLayerOpts) {
  const features = Array.isArray(opts.data)
    ? opts.data
    : (opts.data as GeoJSON.FeatureCollection)?.features ?? [];

  return new H3HexagonLayer({
    id: 'h3-hotspot-layer',
    data: features,
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
      const type = (feat.properties as { type?: string })?.type;
      const z = (feat.properties as { z?: number })?.z;
      if (type === 'cold' || (z != null && z < 0)) {
        return [255, 0, 255, 178]; // neonMagenta for cold
      }
      return [204, 255, 0, 178]; // neonGreen for hot
    },
    getLineColor: [204, 255, 0, 255],
    lineWidthMinPixels: 2,
    getElevation: 0,
    opacity: opts.opacity ?? 0.85,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 120],
    onHover: opts.onHover,
    onClick: opts.onClick,
  });
}
