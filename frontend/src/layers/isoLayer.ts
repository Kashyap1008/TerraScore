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

  // 30 min outer ring
  if (!map.getLayer('iso-fill-30')) {
    map.addLayer({
      id: 'iso-fill-30',
      type: 'fill',
      source: 'isochrone-source',
      filter: ['==', ['get', 'minutes'], 30],
      paint: {
        'fill-color': '#0284C7',
        'fill-opacity': 0.07,
      },
    });
  }

  // 20 min middle ring
  if (!map.getLayer('iso-fill-20')) {
    map.addLayer({
      id: 'iso-fill-20',
      type: 'fill',
      source: 'isochrone-source',
      filter: ['==', ['get', 'minutes'], 20],
      paint: {
        'fill-color': '#0284C7',
        'fill-opacity': 0.12,
      },
    });
  }

  // 10 min inner ring
  if (!map.getLayer('iso-fill-10')) {
    map.addLayer({
      id: 'iso-fill-10',
      type: 'fill',
      source: 'isochrone-source',
      filter: ['==', ['get', 'minutes'], 10],
      paint: {
        'fill-color': '#0284C7',
        'fill-opacity': 0.18,
      },
    });
  }

  // Dashed outline
  if (!map.getLayer('iso-outline')) {
    map.addLayer({
      id: 'iso-outline',
      type: 'line',
      source: 'isochrone-source',
      paint: {
        'line-color': '#0284C7',
        'line-width': 1.5,
        'line-dasharray': [4, 2],
      },
    });
  }
}

export function removeIsoLayers(map: maplibregl.Map) {
  if (map.getLayer('iso-outline')) map.removeLayer('iso-outline');
  if (map.getLayer('iso-fill-10')) map.removeLayer('iso-fill-10');
  if (map.getLayer('iso-fill-20')) map.removeLayer('iso-fill-20');
  if (map.getLayer('iso-fill-30')) map.removeLayer('iso-fill-30');
  if (map.getSource('isochrone-source')) map.removeSource('isochrone-source');
}
