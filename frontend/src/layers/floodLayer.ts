import type * as maplibregl from 'maplibre-gl';

export function addFloodLayer(map: maplibregl.Map) {
  if (!map.getSource('mock-flood-source')) {
    map.addSource('mock-flood-source', {
      type: 'geojson',
      data: '/mock_flood.geojson',
    });
  }

  if (!map.getLayer('flood-fill')) {
    map.addLayer({
      id: 'flood-fill',
      type: 'fill',
      source: 'mock-flood-source',
      paint: {
        'fill-color': '#FF00FF',
        'fill-opacity': 0.15,
      },
    });
  }

  if (!map.getLayer('flood-outline')) {
    map.addLayer({
      id: 'flood-outline',
      type: 'line',
      source: 'mock-flood-source',
      paint: {
        'line-color': '#FF00FF',
        'line-width': 1.5,
        'line-dasharray': [4, 2],
      },
    });
  }
}

export function removeFloodLayer(map: maplibregl.Map) {
  if (map.getLayer('flood-outline')) {
    map.removeLayer('flood-outline');
  }
  if (map.getLayer('flood-fill')) {
    map.removeLayer('flood-fill');
  }
  if (map.getSource('mock-flood-source')) {
    map.removeSource('mock-flood-source');
  }
}
