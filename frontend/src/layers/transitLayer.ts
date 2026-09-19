import { ScatterplotLayer } from '@deck.gl/layers';

export function createTransitLayer(features: GeoJSON.Feature[]) {
  return new ScatterplotLayer({
    id: 'transit-stops-layer',
    data: features,
    pickable: false,
    getPosition: (d: GeoJSON.Feature) => {
      const geom = d.geometry as GeoJSON.Point;
      return geom.coordinates as [number, number];
    },
    getFillColor: [255, 255, 255, 220],
    getRadius: 2,
    radiusMinPixels: 2,
    radiusMaxPixels: 6,
  });
}
