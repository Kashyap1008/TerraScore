import type * as maplibregl from 'maplibre-gl';

export function addIsoLayers(
  map: maplibregl.Map,
  data: GeoJSON.FeatureCollection | string = '/mock_iso.geojson'
) {
  if (!map.getSource('isochrone-source')) {
    map.addSource('isochrone-source', {
      type: 'geojson',
      data,
    });
  } else {
    const src = map.getSource('isochrone-source') as maplibregl.GeoJSONSource;
    if (src && typeof data !== 'string') {
      src.setData(data);
    }
  }

  // 15-min outer ring (widest, most transparent)
  if (!map.getLayer('iso-fill-15')) {
    map.addLayer({
      id: 'iso-fill-15',
      type: 'fill',
      source: 'isochrone-source',
      filter: ['==', ['get', 'minutes'], 15],
      paint: {
        'fill-color': '#0EA5E9',
        'fill-opacity': 0.07,
      },
    });
  }

  // 10-min middle ring
  if (!map.getLayer('iso-fill-10')) {
    map.addLayer({
      id: 'iso-fill-10',
      type: 'fill',
      source: 'isochrone-source',
      filter: ['==', ['get', 'minutes'], 10],
      paint: {
        'fill-color': '#0EA5E9',
        'fill-opacity': 0.13,
      },
    });
  }

  // 5-min inner ring (darkest)
  if (!map.getLayer('iso-fill-5')) {
    map.addLayer({
      id: 'iso-fill-5',
      type: 'fill',
      source: 'isochrone-source',
      filter: ['==', ['get', 'minutes'], 5],
      paint: {
        'fill-color': '#0EA5E9',
        'fill-opacity': 0.22,
      },
    });
  }

  // Dashed outline for all rings
  if (!map.getLayer('iso-outline')) {
    map.addLayer({
      id: 'iso-outline',
      type: 'line',
      source: 'isochrone-source',
      paint: {
        'line-color': '#38BDF8',
        'line-width': 1.5,
        'line-dasharray': [4, 3],
        'line-opacity': 0.85,
      },
    });
  }
}

export function removeIsoLayers(map: maplibregl.Map) {
  ['iso-outline', 'iso-fill-5', 'iso-fill-10', 'iso-fill-15'].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource('isochrone-source')) map.removeSource('isochrone-source');
}
