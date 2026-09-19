import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, GeoJsonLayer } from '@deck.gl/layers';
import { Protocol } from 'pmtiles';
import { createHexLayer } from '../layers/hexLayer';
import { addRoadLayer, removeRoadLayer } from '../layers/roadLayer';
import { createPoiLayers } from '../layers/poiLayer';
import { addFloodLayer, removeFloodLayer } from '../layers/floodLayer';
import { createTransitLayer } from '../layers/transitLayer';
import { createHotspotLayer } from '../layers/hotspotLayer';
import { addIsoLayers, removeIsoLayers } from '../layers/isoLayer';
import DrawTool from './DrawTool';
import { useAppStore } from '../store/useAppStore';

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

let protocolRegistered = false;
function ensurePmtilesProtocol() {
  if (!protocolRegistered) {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    protocolRegistered = true;
  }
}

const mapStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    cartoLight: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#F8FAFC' } },
    {
      id: 'cartoLight',
      type: 'raster',
      source: 'cartoLight',
      paint: {
        'raster-saturation': 0.1,
        'raster-contrast': 0.05,
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
  const onPolygonDrawRef = useRef(props.onPolygonDraw);

  const {
    layerOpacity,
    drawnPolygon,
    setDrawnPolygon,
    selectedSite,
    isochroneData,
    flyTo,
  } = useAppStore();

  const [mapReady, setMapReady] = useState(false);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [scoresGeojson, setScoresGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [poiFeatures, setPoiFeatures] = useState<GeoJSON.Feature[]>([]);
  const [transitFeatures, setTransitFeatures] = useState<GeoJSON.Feature[]>([]);
  const [hotspotFeatures, setHotspotFeatures] = useState<GeoJSON.Feature[]>([]);
  const [hoveredCell, setHoveredCell] = useState<HoveredCellInfo | null>(null);
  const [pmtilesAvailable, setPmtilesAvailable] = useState(false);
  const [pmtilesBaseUrl, setPmtilesBaseUrl] = useState<string>('/tiles');

  // Drawing state
  const [drawing, setDrawing] = useState(false);
  const [drawVertices, setDrawVertices] = useState<[number, number][]>([]);

  useEffect(() => {
    onMapClickRef.current = props.onMapClick;
    onPolygonDrawRef.current = props.onPolygonDraw;
  }, [props.onMapClick, props.onPolygonDraw]);

  // Check PMTiles manifest & load fallback datasets on mount
  useEffect(() => {
    ensurePmtilesProtocol();

    const checkManifest = async () => {
      try {
        let res = await fetch('/tiles/manifest.json');
        let basePath = '/tiles';
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
          res = await fetch('/static/tiles/manifest.json');
          basePath = '/static/tiles';
        }
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const manifest = await res.json();
          const hasH3Grid =
            manifest &&
            (Array.isArray(manifest.layers)
              ? manifest.layers.some((l: { id: string }) => l.id === 'h3_grid')
              : Boolean(manifest.layers?.h3_grid || manifest.h3_grid));

          if (hasH3Grid) {
            setPmtilesBaseUrl(basePath);
            setPmtilesAvailable(true);
            return;
          }
        }
      } catch (err) {
        console.warn('Tiles manifest check failed, retaining geojson fallback:', err);
      }
      setPmtilesAvailable(false);
    };

    checkManifest();

    // Fallback datasets
    fetch('/mock_scores.geojson')
      .then((res) => (res.ok ? (res.json() as Promise<GeoJSON.FeatureCollection>) : null))
      .then((data) => {
        if (data) setScoresGeojson(data);
      })
      .catch((err: unknown) => console.warn('Failed to load /mock_scores.geojson:', err));

    fetch('/mock_pois.geojson')
      .then((res) => (res.ok ? (res.json() as Promise<GeoJSON.FeatureCollection>) : null))
      .then((data) => {
        if (data?.features) setPoiFeatures(data.features);
      })
      .catch((err: unknown) => console.warn('Failed to load /mock_pois.geojson:', err));

    fetch('/mock_transit.geojson')
      .then((res) => (res.ok ? (res.json() as Promise<GeoJSON.FeatureCollection>) : null))
      .then((data) => {
        if (data?.features) setTransitFeatures(data.features);
      })
      .catch((err: unknown) => console.warn('Failed to load /mock_transit.geojson:', err));

    fetch('/mock_hotspots.geojson')
      .then((res) => (res.ok ? (res.json() as Promise<GeoJSON.FeatureCollection>) : null))
      .then((data) => {
        if (data?.features) setHotspotFeatures(data.features);
      })
      .catch((err: unknown) => console.warn('Failed to load /mock_hotspots.geojson:', err));
  }, []);

  // Handle map clicks (normal or drawing vertices)
  const handleCoordClick = (lat: number, lon: number) => {
    if (drawing) {
      const next: [number, number][] = [...drawVertices, [lon, lat]];
      if (next.length >= 3) {
        const ring: [number, number][] = [next[0], next[1], next[2], next[0]];
        const poly: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [ring],
        };
        setDrawing(false);
        setDrawVertices([]);
        setDrawnPolygon(poly);
        onPolygonDrawRef.current(poly);
      } else {
        setDrawVertices(next);
      }
    } else {
      onMapClickRef.current(lat, lon);
    }
  };

  // Convert dynamic isochrone data into GeoJSON FeatureCollection
  const dynamicIsoGeoJSON = useMemo(() => {
    if (!isochroneData?.polygons) return null;
    const features: GeoJSON.Feature[] = Object.entries(isochroneData.polygons).map(
      ([mins, poly]) => ({
        type: 'Feature',
        properties: { minutes: parseInt(mins, 10) },
        geometry: poly,
      })
    );
    return { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection;
  }, [isochroneData]);

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
      handleCoordClick(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [drawing, drawVertices]);

  // Smooth camera flying to selectedSite (e.g. from demo pins or compare chips)
  useEffect(() => {
    if (!selectedSite || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [selectedSite.lon, selectedSite.lat],
      zoom: 14,
      essential: true,
      speed: 1.2,
    });
  }, [selectedSite]);

  // Sync MapLibre vector/raster layers (roads, flood_zones, isochrone, pmtiles)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Roads (cyan glow & linework)
    if (props.activeLayers.includes('roads')) {
      addRoadLayer(map);
    } else {
      removeRoadLayer(map);
    }

    // Flood Zones (magenta polygons)
    if (props.activeLayers.includes('flood_zones')) {
      addFloodLayer(map);
    } else {
      removeFloodLayer(map);
    }

    // Isochrone (concentric green rings)
    if (props.activeLayers.includes('isochrone')) {
      addIsoLayers(map, dynamicIsoGeoJSON || '/mock_iso.geojson');
    } else {
      removeIsoLayers(map);
    }

    // Real PMTiles layer swap if available
    const pmtilesUrl = `pmtiles://${window.location.origin}${pmtilesBaseUrl}/h3_grid.pmtiles`;

    if (pmtilesAvailable && (props.activeLayers.includes('h3_grid') || props.activeLayers.includes('hotspots'))) {
      if (!map.getSource('pmtiles-h3')) {
        map.addSource('pmtiles-h3', {
          type: 'vector',
          url: pmtilesUrl,
        });
      }
    }

    // PMTiles Base H3 Grid
    if (pmtilesAvailable && props.activeLayers.includes('h3_grid')) {
      if (!map.getLayer('pmtiles-h3-layer')) {
        map.addLayer({
          id: 'pmtiles-h3-layer',
          type: 'fill',
          source: 'pmtiles-h3',
          'source-layer': 'h3_grid',
          paint: {
            'fill-opacity': layerOpacity?.h3_grid ?? 0.75,
            'fill-color': [
              'step',
              ['coalesce', ['get', 'score_retail'], ['get', 'score'], 0],
              '#EF4444',
              40, '#F59E0B',
              60, '#06B6D4',
              80, '#10B981',
            ],
          },
        });

        map.on('mousemove', 'pmtiles-h3-layer', (e) => {
          if (e.features && e.features.length > 0) {
            const f = e.features[0];
            const hex = String(f.properties?.h3_index || f.properties?.h3 || '');
            const score = Number(f.properties?.score_retail ?? f.properties?.score ?? 0);
            setHoveredCell({
              hex,
              score: Math.round(score * 10) / 10,
              x: e.point.x,
              y: e.point.y,
            });
            map.getCanvas().style.cursor = 'pointer';
          }
        });

        map.on('mouseleave', 'pmtiles-h3-layer', () => {
          setHoveredCell(null);
          map.getCanvas().style.cursor = '';
        });
      } else {
        map.setPaintProperty('pmtiles-h3-layer', 'fill-opacity', layerOpacity?.h3_grid ?? 0.75);
      }
    } else {
      if (map.getLayer('pmtiles-h3-layer')) map.removeLayer('pmtiles-h3-layer');
    }

    // PMTiles Hotspots Layer (filtered to hotspot cells with z > 1.96)
    if (pmtilesAvailable && props.activeLayers.includes('hotspots')) {
      if (!map.getLayer('pmtiles-hotspots-layer')) {
        map.addLayer({
          id: 'pmtiles-hotspots-layer',
          type: 'fill',
          source: 'pmtiles-h3',
          'source-layer': 'h3_grid',
          filter: ['>', ['coalesce', ['get', 'hotspot_z_retail'], ['get', 'hotspot_z'], 0], 1.96],
          paint: {
            'fill-color': '#10B981',
            'fill-opacity': 0.85 * (layerOpacity?.hotspots ?? 1.0),
          },
        });
      } else {
        map.setPaintProperty('pmtiles-hotspots-layer', 'fill-opacity', 0.85 * (layerOpacity?.hotspots ?? 1.0));
      }

      if (!map.getLayer('pmtiles-hotspots-line')) {
        map.addLayer({
          id: 'pmtiles-hotspots-line',
          type: 'line',
          source: 'pmtiles-h3',
          'source-layer': 'h3_grid',
          filter: ['>', ['coalesce', ['get', 'hotspot_z_retail'], ['get', 'hotspot_z'], 0], 1.96],
          paint: {
            'line-color': '#059669',
            'line-width': 2,
            'line-opacity': layerOpacity?.hotspots ?? 1.0,
          },
        });
      } else {
        map.setPaintProperty('pmtiles-hotspots-line', 'line-opacity', layerOpacity?.hotspots ?? 1.0);
      }
    } else {
      if (map.getLayer('pmtiles-hotspots-line')) map.removeLayer('pmtiles-hotspots-line');
      if (map.getLayer('pmtiles-hotspots-layer')) map.removeLayer('pmtiles-hotspots-layer');
    }

    // Cleanup pmtiles source if neither layer is active
    if (!pmtilesAvailable || (!props.activeLayers.includes('h3_grid') && !props.activeLayers.includes('hotspots'))) {
      if (map.getSource('pmtiles-h3')) {
        if (!map.getLayer('pmtiles-h3-layer') && !map.getLayer('pmtiles-hotspots-layer')) {
          map.removeSource('pmtiles-h3');
        }
      }
    }
  }, [props.activeLayers, mapReady, pmtilesAvailable, pmtilesBaseUrl, layerOpacity, dynamicIsoGeoJSON]);

  // FlyTo effect
  useEffect(() => {
    const map = mapRef.current;
    if (map && mapReady && flyTo) {
      map.flyTo({
        center: [flyTo.lon, flyTo.lat],
        zoom: flyTo.zoom || 14,
        essential: true
      });
      useAppStore.getState().setFlyTo(null);
    }
  }, [flyTo, mapReady]);

  // Build deck.gl layers
  const deckLayers = [];

  // 1. H3 Hex Score layer (fallback when not using PMTiles)
  if (!pmtilesAvailable && props.activeLayers.includes('h3_grid') && scoresGeojson) {
    deckLayers.push(
      createHexLayer({
        data: scoresGeojson,
        opacity: layerOpacity?.h3_grid ?? 0.75,
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
            handleCoordClick(pickInfo.coordinate[1], pickInfo.coordinate[0]);
          }
        },
      })
    );
  }

  // 2. Hotspot layer (fallback when not using PMTiles)
  if (!pmtilesAvailable && props.activeLayers.includes('hotspots') && hotspotFeatures.length > 0) {
    deckLayers.push(
      createHotspotLayer({
        data: hotspotFeatures,
        opacity: 0.9 * (layerOpacity?.hotspots ?? 1.0),
        onHover: (info: unknown) => {
          const pickInfo = info as { object?: GeoJSON.Feature; x?: number; y?: number };
          if (pickInfo.object?.properties) {
            const p = pickInfo.object.properties as { h3: string; score: number; z: number };
            setHoveredCell({
              hex: p.h3,
              score: p.score,
              x: pickInfo.x ?? 0,
              y: pickInfo.y ?? 0,
            });
          }
        },
        onClick: (info: unknown) => {
          const pickInfo = info as { coordinate?: [number, number] };
          if (pickInfo.coordinate) {
            handleCoordClick(pickInfo.coordinate[1], pickInfo.coordinate[0]);
          }
        },
      })
    );
  }

  // 3. POIs layer (magenta diamonds for competitors + cyan circles for anchors)
  if (props.activeLayers.includes('pois') && poiFeatures.length > 0) {
    deckLayers.push(...createPoiLayers(poiFeatures));
  }

  // 4. Transit stops layer (white dots)
  if (props.activeLayers.includes('transit_stops') && transitFeatures.length > 0) {
    deckLayers.push(createTransitLayer(transitFeatures));
  }

  // 5. Candidate Pins
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

  // 6. Drawn search polygon visualization
  if (drawnPolygon) {
    deckLayers.push(
      new GeoJsonLayer({
        id: 'drawn-polygon-layer',
        data: drawnPolygon,
        pickable: false,
        stroked: true,
        filled: true,
        getFillColor: [0, 229, 255, 45],
        getLineColor: [0, 229, 255, 255],
        getLineWidth: 2,
        lineWidthMinPixels: 2,
      })
    );
  }

  // 7. Active drawing vertices
  if (drawVertices.length > 0) {
    deckLayers.push(
      new ScatterplotLayer({
        id: 'draw-vertices-layer',
        data: drawVertices,
        pickable: false,
        getPosition: (d: unknown) => d as [number, number],
        getFillColor: [0, 229, 255, 255],
        radiusMinPixels: 5,
      })
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* MapLibre canvas container */}
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
              handleCoordClick(pickInfo.coordinate[1], pickInfo.coordinate[0]);
            }
          }}
        />
      </div>

      {/* Hover tooltip */}
      {hoveredCell && (
        <div
          className="absolute pointer-events-none z-[10] bg-white/95 backdrop-blur border border-slate-200 px-3 py-2 rounded-lg shadow-xl font-mono text-slate-800 text-xs space-y-0.5 border-l-4"
          style={{
            left: `${hoveredCell.x + 14}px`,
            top: `${hoveredCell.y + 14}px`,
            borderLeftColor:
              hoveredCell.score >= 80
                ? '#10B981'
                : hoveredCell.score >= 60
                ? '#06B6D4'
                : hoveredCell.score >= 40
                ? '#F59E0B'
                : '#EF4444',
          }}
        >
          <div className="text-slate-500 text-[10px]">
            H3: {hoveredCell.hex.length > 8 ? `${hoveredCell.hex.slice(0, 8)}…` : hoveredCell.hex}
          </div>
          <div className="font-bold flex items-center justify-between gap-3 text-slate-900">
            <span>SITE SCORE:</span>
            <span
              className="font-extrabold text-sm"
              style={{
                color:
                  hoveredCell.score >= 80
                    ? '#059669'
                    : hoveredCell.score >= 60
                    ? '#0284C7'
                    : hoveredCell.score >= 40
                    ? '#D97706'
                    : '#DC2626',
              }}
            >
              {hoveredCell.score}
            </span>
          </div>
        </div>
      )}

      {/* Score legend */}
      <div className="absolute bottom-6 right-6 z-[10] bg-white/90 backdrop-blur border border-slate-200 px-3.5 py-2.5 rounded-lg shadow-lg font-mono text-[11px] select-none text-slate-700">
        <div className="text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between text-[10px] font-semibold">
          <span>SUITABILITY INDEX</span>
          <span>&rarr;</span>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#10B981] inline-block shadow-xs" />
            <span className="text-slate-800 font-medium">80+</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#06B6D4] inline-block shadow-xs" />
            <span className="text-slate-800 font-medium">60–79</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#F59E0B] inline-block shadow-xs" />
            <span className="text-slate-800 font-medium">40–59</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#EF4444] inline-block shadow-xs" />
            <span className="text-slate-800 font-medium">&lt;40</span>
          </div>
        </div>
      </div>

      {/* Draw tool */}
      <DrawTool
        drawing={drawing}
        onToggleDrawing={() => {
          setDrawing((prev) => !prev);
          setDrawVertices([]);
        }}
        hasPolygon={!!drawnPolygon}
        onClearPolygon={() => {
          setDrawnPolygon(null);
          onPolygonDrawRef.current({ type: 'Polygon', coordinates: [] });
        }}
        vertexCount={drawVertices.length}
        onPolygonDraw={props.onPolygonDraw}
      />

      {/* Cyber-grid overlay & status tag */}
      <div className="cyber-grid absolute inset-0 pointer-events-none z-[1]" />
      <div className="absolute top-3 left-3 z-[2] font-mono text-[11px] uppercase tracking-wider text-emerald-700 bg-white/90 backdrop-blur border border-slate-200 px-2.5 py-1 rounded-md shadow-xs font-semibold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>MAP ENGINE // LIVE</span>
      </div>
    </div>
  );
}
