import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { createHexLayer } from '../layers/hexLayer';
import { addRoadLayer, removeRoadLayer } from '../layers/roadLayer';
import { createPoiLayers } from '../layers/poiLayer';
import { addFloodLayer, removeFloodLayer } from '../layers/floodLayer';
import { createTransitLayer } from '../layers/transitLayer';

export interface MapViewProps {
  activeLayers: string[];
  onMapClick: (lat: number, lon: number) => void;
  onPolygonDraw: (geojson: GeoJSON.Polygon) => void;
  candidatePins: { lat: number; lon: number }[];
}

interface HoveredCellInfo {
  hex: string;
  score: number;
  x: number;
  y: number;
}

const mapStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#050505' } },
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-saturation': -1,
        'raster-brightness-min': 0,
        'raster-brightness-max': 0.5,
        'raster-contrast': 0.2,
      },
    },
  ],
};

const INITIAL_VIEW_STATE = {
  longitude: -97.7431,
  latitude: 30.2672,
  zoom: 11,
  pitch: 0,
  bearing: 0,
};

export default function MapView(props: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onMapClickRef = useRef(props.onMapClick);

  const [mapReady, setMapReady] = useState(false);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [scoresGeojson, setScoresGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [poiFeatures, setPoiFeatures] = useState<GeoJSON.Feature[]>([]);
  const [transitFeatures, setTransitFeatures] = useState<GeoJSON.Feature[]>([]);
  const [hoveredCell, setHoveredCell] = useState<HoveredCellInfo | null>(null);

  useEffect(() => {
    onMapClickRef.current = props.onMapClick;
  }, [props.onMapClick]);

  // Load mock data on mount
  useEffect(() => {
    fetch('/mock_scores.geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<GeoJSON.FeatureCollection>;
      })
      .then((data) => {
        setScoresGeojson(data);
      })
      .catch((err: unknown) => {
        console.warn('Failed to load /mock_scores.geojson:', err);
      });

    fetch('/mock_pois.geojson')
      .then((res) => (res.ok ? (res.json() as Promise<GeoJSON.FeatureCollection>) : null))
      .then((data) => {
        if (data?.features) setPoiFeatures(data.features);
      })
      .catch((err: unknown) => {
        console.warn('Failed to load /mock_pois.geojson:', err);
      });

    fetch('/mock_transit.geojson')
      .then((res) => (res.ok ? (res.json() as Promise<GeoJSON.FeatureCollection>) : null))
      .then((data) => {
        if (data?.features) setTransitFeatures(data.features);
      })
      .catch((err: unknown) => {
        console.warn('Failed to load /mock_transit.geojson:', err);
      });
  }, []);

  // Initialize MapLibre
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      console.log('MapView ready');
      setMapReady(true);
    });

    map.on('move', () => {
      const center = map.getCenter();
      setViewState({
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      });
    });

    map.on('click', (e: maplibregl.MapLayerMouseEvent) => {
      onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Sync MapLibre vector/raster layers (roads, flood_zones)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (props.activeLayers.includes('roads')) {
      addRoadLayer(map);
    } else {
      removeRoadLayer(map);
    }

    if (props.activeLayers.includes('flood_zones')) {
      addFloodLayer(map);
    } else {
      removeFloodLayer(map);
    }
  }, [props.activeLayers, mapReady]);

  // Build deck.gl layers
  const deckLayers = [];

  if (props.activeLayers.includes('h3_grid') && scoresGeojson) {
    deckLayers.push(
      createHexLayer({
        data: scoresGeojson,
        onHover: (info: unknown) => {
          const pickInfo = info as { object?: GeoJSON.Feature; x?: number; y?: number };
          if (pickInfo.object?.properties) {
            const p = pickInfo.object.properties as { h3: string; score: number };
            setHoveredCell({
              hex: p.h3,
              score: p.score,
              x: pickInfo.x ?? 0,
              y: pickInfo.y ?? 0,
            });
          } else {
            setHoveredCell(null);
          }
        },
        onClick: (info: unknown) => {
          const pickInfo = info as { coordinate?: [number, number] };
          if (pickInfo.coordinate) {
            onMapClickRef.current(pickInfo.coordinate[1], pickInfo.coordinate[0]);
          }
        },
      })
    );
  }

  if (props.activeLayers.includes('pois') && poiFeatures.length > 0) {
    deckLayers.push(...createPoiLayers(poiFeatures));
  }

  if (props.activeLayers.includes('transit_stops') && transitFeatures.length > 0) {
    deckLayers.push(createTransitLayer(transitFeatures));
  }

  if (props.candidatePins && props.candidatePins.length > 0) {
    deckLayers.push(
      new ScatterplotLayer({
        id: 'candidate-pins-layer',
        data: props.candidatePins,
        pickable: false,
        getPosition: (d: unknown) => {
          const pin = d as { lat: number; lon: number };
          return [pin.lon, pin.lat];
        },
        getFillColor: [0, 229, 255, 255],
        getLineColor: [255, 255, 255, 255],
        stroked: true,
        lineWidthMinPixels: 2,
        radiusMinPixels: 7,
        radiusMaxPixels: 14,
      })
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* MapLibre container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* deck.gl overlay */}
      <div className="absolute inset-0 z-[1]">
        <DeckGL
          viewState={viewState}
          layers={deckLayers}
          controller={false}
          getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'default')}
          onClick={(info) => {
            const pickInfo = info as { coordinate?: [number, number] };
            if (pickInfo.coordinate) {
              onMapClickRef.current(pickInfo.coordinate[1], pickInfo.coordinate[0]);
            }
          }}
        />
      </div>

      {/* Hover tooltip */}
      {hoveredCell && (
        <div
          className="absolute pointer-events-none z-[10] bg-panel/90 backdrop-blur border border-neonGreen px-2.5 py-1.5 rounded-sm shadow-neon-green font-mono text-neonGreen text-xs space-y-0.5"
          style={{
            left: `${hoveredCell.x + 12}px`,
            top: `${hoveredCell.y + 12}px`,
          }}
        >
          <div>H3: {hoveredCell.hex.slice(0, 8)}…</div>
          <div className="font-bold">SCORE: {hoveredCell.score}</div>
        </div>
      )}

      {/* Score legend */}
      <div className="absolute bottom-6 right-6 z-[10] bg-panel/85 backdrop-blur border border-panelEdge px-3 py-2 rounded-sm shadow-md font-mono text-[11px] select-none">
        <div className="text-textMuted uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <span>SCORE</span>
          <span>&rarr;</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#CCFF00] inline-block" />
            <span className="text-white">80+</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#00E5FF] inline-block" />
            <span className="text-white">60–79</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FFAA00] inline-block" />
            <span className="text-white">40–59</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FF00FF] inline-block" />
            <span className="text-white">&lt;40</span>
          </div>
        </div>
      </div>

      {/* Cyber-grid overlay & status tag */}
      <div className="cyber-grid absolute inset-0 pointer-events-none z-[1]" />
      <div className="absolute top-3 left-3 z-[2] font-mono text-[11px] uppercase tracking-widest text-[#CCFF00]">
        // MAP_ENGINE :: ONLINE
      </div>
    </div>
  );
}
