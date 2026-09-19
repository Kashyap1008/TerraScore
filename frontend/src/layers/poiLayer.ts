import { ScatterplotLayer, IconLayer } from '@deck.gl/layers';

export interface PoiLayerOpts {
  onHover?: (info: unknown) => void;
  onClick?: (info: unknown) => void;
}

const MAGENTA_DIAMOND_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" fill="%23FF00FF" stroke="%23FFFFFF" stroke-width="1.5"/></svg>';

export function createPoiLayers(
  features: GeoJSON.Feature[],
  opts?: PoiLayerOpts
) {
  const competitors = features.filter(
    (f) => (f.properties as { type?: string })?.type === 'competitor'
  );
  const anchors = features.filter(
    (f) => (f.properties as { type?: string })?.type === 'anchor'
  );

  const competitorLayer = new IconLayer({
    id: 'poi-competitors-layer',
    data: competitors,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
    getPosition: (d: unknown) => {
      const feat = d as GeoJSON.Feature;
      const geom = feat.geometry as GeoJSON.Point;
      return geom.coordinates as [number, number];
    },
    getIcon: () => ({
      url: MAGENTA_DIAMOND_SVG,
      width: 24,
      height: 24,
      mask: false,
    }),
    getSize: 16,
    sizeScale: 1,
    sizeMinPixels: 10,
    sizeMaxPixels: 22,
    onHover: opts?.onHover,
    onClick: opts?.onClick,
  });

  const anchorLayer = new ScatterplotLayer({
    id: 'poi-anchors-layer',
    data: anchors,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
    getPosition: (d: GeoJSON.Feature) => {
      const geom = d.geometry as GeoJSON.Point;
      return geom.coordinates as [number, number];
    },
    getFillColor: [0, 229, 255, 230],
    getRadius: 6,
    radiusMinPixels: 5,
    radiusMaxPixels: 14,
    stroked: true,
    getLineColor: [255, 255, 255, 220],
    lineWidthMinPixels: 1.5,
    onHover: opts?.onHover,
    onClick: opts?.onClick,
  });

  return [competitorLayer, anchorLayer];
}
