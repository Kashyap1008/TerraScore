import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
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
import { AUSTIN_AREAS, type AustinArea } from '../config/austinAreas';
import { resolveLocationName } from '../utils/locationResolver';

export interface MapViewProps {
  activeLayers: string[];
  onMapClick: (lat: number, lon: number) => void;
  onPolygonDraw: (geojson: GeoJSON.Polygon) => void;
  candidatePins: { lat: number; lon: number }[];
}

export type BasemapMode = 'satellite' | 'streets' | 'dark';

interface HoveredCellInfo {
  hex: string;
  score: number;
  x: number;
  y: number;
  locationName: string;
  submarket: string;
  coordsFormatted: string;
}

let protocolRegistered = false;
function ensurePmtilesProtocol() {
  if (!protocolRegistered) {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    protocolRegistered = true;
  }
}

// Clean, high-resolution basemap specification for MapLibre
const mapStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri, Maxar, Earthstar Geographics',
    },
    satelliteLabels: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri',
    },
    esriStreets: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri, HERE, Garmin',
    },
    esriDark: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri, HERE, Garmin',
    },
    esriDarkLabels: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri',
    },
  },
  layers: [
    {
      id: 'bg',
      type: 'background',
      paint: { 'background-color': '#f8fafc' }
    },
    {
      id: 'sat',
      type: 'raster',
      source: 'satellite',
      layout: { visibility: 'visible' },
      paint: { 'raster-opacity': 1.0 },
    },
    {
      id: 'streets',
      type: 'raster',
      source: 'esriStreets',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 1.0 },
    },
    {
      id: 'dark',
      type: 'raster',
      source: 'esriDark',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 1.0 },
    },
    {
      id: 'dark-labels',
      type: 'raster',
      source: 'esriDarkLabels',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.95 },
    },
    {
      id: 'lab',
      type: 'raster',
      source: 'satelliteLabels',
      layout: { visibility: 'visible' },
      paint: { 'raster-opacity': 0.95 },
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
  const overlayRef = useRef<MapboxOverlay | null>(null);

  // Mutable refs to prevent useEffect tearing down map
  const onMapClickRef = useRef(props.onMapClick);
  const onPolygonDrawRef = useRef(props.onPolygonDraw);
  const drawingRef = useRef(false);
  const drawVerticesRef = useRef<[number, number][]>([]);

  const {
    layerOpacity,
    drawnPolygon,
    setDrawnPolygon,
    selectedSite,
    isochroneData,
    flyTo,
  } = useAppStore();

  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_VIEW_STATE.zoom);
  const [scoresGeojson, setScoresGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [poiFeatures, setPoiFeatures] = useState<GeoJSON.Feature[]>([]);
  const [transitFeatures, setTransitFeatures] = useState<GeoJSON.Feature[]>([]);
  const [hotspotFeatures, setHotspotFeatures] = useState<GeoJSON.Feature[]>([]);
  const [hoveredCell, setHoveredCell] = useState<HoveredCellInfo | null>(null);
  const [pmtilesAvailable, setPmtilesAvailable] = useState(false);
  const [pmtilesBaseUrl, setPmtilesBaseUrl] = useState<string>('/tiles');

  // Basemap & Area State
  const [basemap, setBasemap] = useState<BasemapMode>('satellite');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
  const [filterByArea, setFilterByArea] = useState<boolean>(false);

  // Drawing state
  const [drawing, setDrawing] = useState(false);
  const [drawVertices, setDrawVertices] = useState<[number, number][]>([]);

  useEffect(() => {
    onMapClickRef.current = props.onMapClick;
    onPolygonDrawRef.current = props.onPolygonDraw;
  }, [props.onMapClick, props.onPolygonDraw]);

  useEffect(() => {
    drawingRef.current = drawing;
    drawVerticesRef.current = drawVertices;
  }, [drawing, drawVertices]);

  // Handle map clicks (normal or drawing vertices)
  const handleCoordClickRef = useRef<(lat: number, lon: number) => void>(() => {});

  const handleCoordClick = (lat: number, lon: number) => {
    if (drawingRef.current) {
      const next: [number, number][] = [...drawVerticesRef.current, [lon, lat]];
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
  useEffect(() => {
    handleCoordClickRef.current = handleCoordClick;
  });

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

  // Filter features if area filter is active
  const displayedHexFeatures = useMemo(() => {
    if (!scoresGeojson?.features) return [];
    if (selectedAreaId === 'all' || !filterByArea) {
      return scoresGeojson.features;
    }
    const area = AUSTIN_AREAS.find((a) => a.id === selectedAreaId);
    if (!area) return scoresGeojson.features;
    const [aLon, aLat] = area.center;
    return scoresGeojson.features.filter((f) => {
      const coords = (f.geometry as GeoJSON.Polygon)?.coordinates?.[0]?.[0];
      if (!coords) return false;
      const dLon = coords[0] - aLon;
      const dLat = coords[1] - aLat;
      return Math.sqrt(dLon * dLon + dLat * dLat) <= 0.045;
    });
  }, [scoresGeojson, selectedAreaId, filterByArea]);

  // Handle Area Selection & Camera Flight
  const handleSelectArea = (area: AustinArea) => {
    setSelectedAreaId(area.id);
    const map = mapRef.current;
    if (map) {
      map.flyTo({
        center: area.center,
        zoom: area.zoom,
        speed: 1.2,
        essential: true,
      });
    }
  };

  // Zoom button handlers directly using MapLibre's camera animations
  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 250 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 250 });
  };

  const handleResetNorth = () => {
    mapRef.current?.resetNorthPitch({ duration: 300 });
  };

  const handleResetMetro = () => {
    setSelectedAreaId('all');
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
        speed: 1.2,
      });
    }
  };

  // Initialize MapLibre & DeckGL MapboxOverlay ONCE on mount
  useEffect(() => {
    if (!containerRef.current) return;

    let map: maplibregl.Map | null = null;
    let overlay: MapboxOverlay | null = null;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
        attributionControl: false,
      });

      overlay = new MapboxOverlay({
        interleaved: false,
        layers: [],
      });
      map.addControl(overlay as unknown as maplibregl.IControl);
      overlayRef.current = overlay;
    } catch (err) {
      console.error('MAP_CONSTRUCTOR_CRITICAL_ERROR:', err);
      return;
    }

    mapRef.current = map;
    Object.assign(window, { __map: map });

    map.on('load', () => {
      setMapReady(true);
      map?.resize();
    });

    const updateZoom = () => {
      if (map) setCurrentZoom(map.getZoom());
    };

    map.on('zoom', updateZoom);
    map.on('move', updateZoom);

    // Delayed resize to ensure layout is measured
    const timer = setTimeout(() => {
      map?.resize();
    }, 150);

    map.on('click', (e: maplibregl.MapLayerMouseEvent) => {
      handleCoordClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    map.on('error', (e) => {
      console.warn('MapLibre internal notice:', e);
    });

    return () => {
      clearTimeout(timer);
      if (overlayRef.current && map) {
        try {
          map.removeControl(overlayRef.current as unknown as maplibregl.IControl);
        } catch {
          // Ignore control removal errors on teardown
        }
      }
      overlayRef.current = null;
      if (map) {
        map.remove();
      }
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

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

  // FlyTo effect from store
  useEffect(() => {
    const map = mapRef.current;
    if (map && mapReady && flyTo) {
      map.flyTo({
        center: [flyTo.lon, flyTo.lat],
        zoom: flyTo.zoom || 14,
        essential: true,
      });
      useAppStore.getState().setFlyTo(null);
    }
  }, [flyTo, mapReady]);

  // Switch Basemap raster layers instantly
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const isSatellite = basemap === 'satellite';
    const isStreets = basemap === 'streets';
    const isDark = basemap === 'dark';

    if (map.getLayer('sat')) {
      map.setLayoutProperty('sat', 'visibility', isSatellite ? 'visible' : 'none');
    }
    if (map.getLayer('lab')) {
      map.setLayoutProperty('lab', 'visibility', isSatellite ? 'visible' : 'none');
    }
    if (map.getLayer('streets')) {
      map.setLayoutProperty('streets', 'visibility', isStreets ? 'visible' : 'none');
    }
    if (map.getLayer('dark')) {
      map.setLayoutProperty('dark', 'visibility', isDark ? 'visible' : 'none');
    }
    if (map.getLayer('dark-labels')) {
      map.setLayoutProperty('dark-labels', 'visibility', isDark ? 'visible' : 'none');
    }
  }, [basemap, mapReady]);

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

    // Isochrone (concentric rings)
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
            'fill-opacity': (layerOpacity?.h3_grid ?? 0.50) * 0.7,
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
            const loc = resolveLocationName(e.lngLat.lat, e.lngLat.lng, hex);
            setHoveredCell({
              hex,
              score: Math.round(score * 10) / 10,
              x: e.point.x,
              y: e.point.y,
              locationName: loc.name,
              submarket: loc.submarket,
              coordsFormatted: loc.coordsFormatted,
            });
            map.getCanvas().style.cursor = 'pointer';
          }
        });

        map.on('mouseleave', 'pmtiles-h3-layer', () => {
          setHoveredCell(null);
          map.getCanvas().style.cursor = '';
        });
      } else {
        map.setPaintProperty('pmtiles-h3-layer', 'fill-opacity', (layerOpacity?.h3_grid ?? 0.50) * 0.7);
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

  const handleDeckClick = (info: unknown) => {
    const pickInfo = info as { coordinate?: [number, number] };
    if (pickInfo.coordinate) {
      handleCoordClickRef.current(pickInfo.coordinate[1], pickInfo.coordinate[0]);
    }
  };

  // Build deck.gl layers
  const deckLayers = useMemo(() => {
    const layers = [];

    // 1. H3 Hex Score layer (rendered with semi-transparency so satellite imagery is clear)
    if (!pmtilesAvailable && props.activeLayers.includes('h3_grid') && displayedHexFeatures.length > 0) {
      layers.push(
        createHexLayer({
          data: { type: 'FeatureCollection', features: displayedHexFeatures },
          opacity: layerOpacity?.h3_grid ?? 0.50,
          onHover: (info: unknown) => {
            const pickInfo = info as { object?: GeoJSON.Feature; coordinate?: [number, number]; x?: number; y?: number };
            if (pickInfo.object?.properties) {
              const p = pickInfo.object.properties as { h3: string; score: number };
              const loc = resolveLocationName(
                pickInfo.coordinate ? pickInfo.coordinate[1] : null,
                pickInfo.coordinate ? pickInfo.coordinate[0] : null,
                p.h3
              );
              setHoveredCell({
                hex: p.h3,
                score: p.score,
                x: pickInfo.x ?? 0,
                y: pickInfo.y ?? 0,
                locationName: loc.name,
                submarket: loc.submarket,
                coordsFormatted: loc.coordsFormatted,
              });
            } else {
              setHoveredCell(null);
            }
          },
          onClick: handleDeckClick,
        })
      );
    }

    // 2. Hotspot layer
    if (!pmtilesAvailable && props.activeLayers.includes('hotspots') && hotspotFeatures.length > 0) {
      layers.push(
        createHotspotLayer({
          data: hotspotFeatures,
          opacity: 0.9 * (layerOpacity?.hotspots ?? 1.0),
          onHover: (info: unknown) => {
            const pickInfo = info as { object?: GeoJSON.Feature; coordinate?: [number, number]; x?: number; y?: number };
            if (pickInfo.object?.properties) {
              const p = pickInfo.object.properties as { h3: string; score: number; z: number };
              const loc = resolveLocationName(
                pickInfo.coordinate ? pickInfo.coordinate[1] : null,
                pickInfo.coordinate ? pickInfo.coordinate[0] : null,
                p.h3
              );
              setHoveredCell({
                hex: p.h3,
                score: p.score,
                x: pickInfo.x ?? 0,
                y: pickInfo.y ?? 0,
                locationName: loc.name,
                submarket: loc.submarket,
                coordsFormatted: loc.coordsFormatted,
              });
            } else {
              setHoveredCell(null);
            }
          },
          onClick: handleDeckClick,
        })
      );
    }

    // 3. POIs layer (magenta diamonds for competitors + cyan circles for anchors)
    if (props.activeLayers.includes('pois') && poiFeatures.length > 0) {
      layers.push(...createPoiLayers(poiFeatures));
    }

    // 4. Transit stops layer (white dots)
    if (props.activeLayers.includes('transit_stops') && transitFeatures.length > 0) {
      layers.push(createTransitLayer(transitFeatures));
    }

    // 5. Candidate Pins
    if (props.candidatePins && props.candidatePins.length > 0) {
      layers.push(
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
      layers.push(
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
      layers.push(
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

    return layers;
  }, [
    pmtilesAvailable,
    props.activeLayers,
    displayedHexFeatures,
    layerOpacity,
    hotspotFeatures,
    poiFeatures,
    transitFeatures,
    props.candidatePins,
    drawnPolygon,
    drawVertices,
  ]);

  // Synchronize deck.gl layers into MapboxOverlay
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({
        layers: deckLayers,
      });
    }
  }, [deckLayers]);

  return (
    <div className="relative w-full h-full">
      {/* MapLibre canvas container (DeckGL MapboxOverlay renders seamlessly locked to MapLibre's camera) */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* FLOATING TOP TOOLBAR: AREA NAVIGATOR + BASEMAP SWITCHER (cleanly positioned between panels) */}
      <div className="absolute top-20 left-72 z-20 flex flex-wrap items-center gap-2 max-w-[calc(100vw-700px)] select-none pointer-events-auto">
        {/* AUSTIN AREA NAVIGATOR */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur border border-slate-200 p-1.5 rounded-lg shadow-md overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <span className="font-mono text-[10px] text-slate-500 uppercase px-2 font-semibold whitespace-nowrap">
            AREAS:
          </span>
          {AUSTIN_AREAS.map((area) => {
            const isSelected = selectedAreaId === area.id;
            return (
              <button
                key={area.id}
                onClick={() => handleSelectArea(area)}
                className={`font-mono text-[11px] px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
                title={area.description}
              >
                {area.shortName}
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Toggle between All Metro vs Focused Area Hexes */}
          {selectedAreaId !== 'all' && (
            <button
              onClick={() => setFilterByArea((prev) => !prev)}
              className={`font-mono text-[10px] px-2 py-1 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                filterByArea
                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filterByArea ? '✓ AREA ONLY' : 'ALL METRO'}
            </button>
          )}
        </div>

        {/* BASEMAP MODE SWITCHER (Satellite vs Streets vs Dark) */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur border border-slate-200 p-1 rounded-lg shadow-md select-none">
          <button
            onClick={() => setBasemap('satellite')}
            className={`font-mono text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              basemap === 'satellite'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 font-medium'
            }`}
            title="ESRI High-Resolution World Imagery + Street Labels"
          >
            <span>🛰️</span>
            <span>SATELLITE</span>
          </button>
          <button
            onClick={() => setBasemap('streets')}
            className={`font-mono text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              basemap === 'streets'
                ? 'bg-sky-700 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 font-medium'
            }`}
            title="ESRI Vector Street Map"
          >
            <span>🗺️</span>
            <span>STREETS</span>
          </button>
          <button
            onClick={() => setBasemap('dark')}
            className={`font-mono text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              basemap === 'dark'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 font-medium'
            }`}
            title="Dark Minimalist Canvas"
          >
            <span>⬛</span>
            <span>DARK</span>
          </button>
        </div>
      </div>

      {/* Hover tooltip with human-readable location name */}
      {hoveredCell && (
        <div
          className="absolute pointer-events-none z-[10] bg-white/95 backdrop-blur-md border border-slate-200 px-3.5 py-2.5 rounded-xl shadow-2xl font-mono text-slate-800 text-xs space-y-1.5 border-l-4 min-w-[220px]"
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
          <div className="flex items-start gap-1.5 font-sans font-bold text-slate-900 text-xs leading-snug">
            <span className="text-emerald-600 text-sm leading-none mt-0.5">📍</span>
            <div>
              <div className="text-slate-900 font-bold">{hoveredCell.locationName}</div>
              <div className="text-[10px] text-emerald-700 font-semibold font-mono">{hoveredCell.submarket}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
            <span>{hoveredCell.coordsFormatted}</span>
            <span className="text-slate-400">H3: {hoveredCell.hex.slice(0, 7)}…</span>
          </div>

          <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between gap-3 text-slate-900">
            <span className="text-[11px] font-semibold text-slate-600 uppercase">Site Score:</span>
            <span
              className="font-extrabold text-sm font-sans"
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
              {hoveredCell.score} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
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

      {/* FLOATING ZOOM & ORIENTATION CONTROLS */}
      <div className="absolute bottom-24 right-6 z-20 flex flex-col items-center bg-white/95 backdrop-blur border border-slate-200 rounded-lg shadow-lg p-1 gap-1 select-none">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center font-mono font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors text-base cursor-pointer"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          +
        </button>

        <div className="font-mono text-[9px] font-semibold text-slate-500 px-1 py-0.5 border-y border-slate-200 text-center min-w-[30px]">
          {Math.round(currentZoom * 10) / 10}z
        </div>

        <button
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center font-mono font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors text-base cursor-pointer"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          –
        </button>

        <div className="w-5 h-px bg-slate-200 my-0.5" />

        <button
          onClick={handleResetNorth}
          className="w-8 h-8 flex items-center justify-center font-mono text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors text-xs cursor-pointer"
          title="Reset North / 2D Orientation"
          aria-label="Reset North"
        >
          🧭
        </button>

        <button
          onClick={handleResetMetro}
          className="w-8 h-8 flex items-center justify-center font-mono text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors text-xs cursor-pointer"
          title="Reset Full Austin Metro View"
          aria-label="Reset Metro"
        >
          🎯
        </button>
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

      {/* Status tag */}
      <div className="absolute bottom-6 left-72 z-20 font-mono text-[11px] uppercase tracking-wider text-emerald-800 bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-md shadow-xs font-semibold flex items-center gap-2 select-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>MAP ENGINE // {basemap.toUpperCase()} HYBRID</span>
      </div>
    </div>
  );
}
