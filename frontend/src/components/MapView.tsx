import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapViewProps {
  activeLayers: string[];
  onMapClick: (lat: number, lon: number) => void;
  onPolygonDraw: (geojson: GeoJSON.Polygon) => void;
  candidatePins: { lat: number; lon: number }[];
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

export default function MapView(props: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onMapClickRef = useRef(props.onMapClick);

  useEffect(() => {
    onMapClickRef.current = props.onMapClick;
  }, [props.onMapClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [-97.7431, 30.2672],
      zoom: 11,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      console.log('MapView ready');
    });

    map.on('click', (e: maplibregl.MapLayerMouseEvent) => {
      onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="cyber-grid absolute inset-0 pointer-events-none z-[1]" />
      <div className="absolute top-3 left-3 z-[2] font-mono text-[11px] uppercase tracking-widest text-[#CCFF00]">
        // MAP_ENGINE :: ONLINE
      </div>
    </div>
  );
}
