import type * as maplibregl from 'maplibre-gl';

export function addRoadLayer(map: maplibregl.Map) {
  if (!map.getSource('carto-roads')) {
    map.addSource('carto-roads', {
      type: 'vector',
      tiles: ['https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/{z}/{x}/{y}.mvt'],
    });
  }

  if (!map.getLayer('roads-glow')) {
    map.addLayer({
      id: 'roads-glow',
      type: 'line',
      source: 'carto-roads',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary'],
      paint: {
        'line-color': '#00E5FF',
        'line-opacity': 0.15,
        'line-width': 4,
      },
    });
  }

  if (!map.getLayer('roads-line')) {
    map.addLayer({
      id: 'roads-line',
      type: 'line',
      source: 'carto-roads',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary'],
      paint: {
        'line-color': '#00E5FF',
        'line-opacity': 0.8,
        'line-width': 1,
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
  if (map.getSource('carto-roads')) {
    map.removeSource('carto-roads');
  }
}
