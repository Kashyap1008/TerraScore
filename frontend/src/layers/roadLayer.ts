import type * as maplibregl from 'maplibre-gl';

export function addRoadLayer(map: maplibregl.Map) {
  if (!map.getSource('mock-roads-source')) {
    map.addSource('mock-roads-source', {
      type: 'geojson',
      data: '/mock_roads.geojson',
    });
  }

  if (!map.getLayer('roads-glow')) {
    map.addLayer({
      id: 'roads-glow',
      type: 'line',
      source: 'mock-roads-source',
      paint: {
        'line-color': '#0284C7',
        'line-opacity': 0.35,
        'line-width': 6,
      },
    });
  }

  if (!map.getLayer('roads-line')) {
    map.addLayer({
      id: 'roads-line',
      type: 'line',
      source: 'mock-roads-source',
      paint: {
        'line-color': '#0284C7',
        'line-opacity': 0.95,
        'line-width': 2.5,
      },
    });
  }
}

export function removeRoadLayer(map: maplibregl.Map) {
  if (map.getLayer('roads-line')) {
    map.removeLayer('roads-line');
  }
  if (map.getLayer('roads-glow')) {
    map.removeLayer('roads-glow');
  }
  if (map.getSource('mock-roads-source')) {
    map.removeSource('mock-roads-source');
  }
}
