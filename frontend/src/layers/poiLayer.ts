import { ScatterplotLayer } from '@deck.gl/layers';

export interface PoiLayerOpts {
  onHover?: (info: unknown) => void;
  onClick?: (info: unknown) => void;
}

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

  const competitorLayer = new ScatterplotLayer({
    id: 'poi-competitors-layer',
    data: competitors,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
    getPosition: (d: GeoJSON.Feature) => {
      const geom = d.geometry as GeoJSON.Point;
      return geom.coordinates as [number, number];
    },
    getFillColor: [255, 0, 255, 220],
    getRadius: 4,
    radiusMinPixels: 4,
    radiusMaxPixels: 10,
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
    getRadius: 5,
    radiusMinPixels: 5,
    radiusMaxPixels: 12,
    stroked: true,
    getLineColor: [255, 255, 255, 220],
    lineWidthMinPixels: 1,
    onHover: opts?.onHover,
    onClick: opts?.onClick,
  });

  return [competitorLayer, anchorLayer];
}
