import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as h3 from 'h3-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../../public');

// Core Indian Metropolitan & Regional Hubs
const HUBS = [
  { name: 'Mumbai & MMR', lat: 19.0760, lon: 72.8777, ring: 13, res: 8, baseScore: 86 },
  { name: 'Delhi NCR', lat: 28.6139, lon: 77.2090, ring: 14, res: 8, baseScore: 84 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, ring: 13, res: 8, baseScore: 88 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, ring: 12, res: 8, baseScore: 82 },
  { name: 'Ahmedabad & GIFT', lat: 23.0225, lon: 72.5714, ring: 12, res: 8, baseScore: 83 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, ring: 12, res: 8, baseScore: 81 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, ring: 11, res: 8, baseScore: 78 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, ring: 10, res: 8, baseScore: 80 },
];

// National State / Regional Anchor Nodes for National Scale View
const NATIONAL_NODES = [
  { lat: 26.8467, lon: 80.9462, name: 'Lucknow' },
  { lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
  { lat: 21.1702, lon: 72.8311, name: 'Surat' },
  { lat: 21.1458, lon: 79.0882, name: 'Nagpur' },
  { lat: 22.7196, lon: 75.8577, name: 'Indore' },
  { lat: 25.5941, lon: 85.1376, name: 'Patna' },
  { lat: 20.2961, lon: 85.8245, name: 'Bhubaneswar' },
  { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam' },
  { lat: 9.9312, lon: 76.2673, name: 'Kochi' },
  { lat: 31.6340, lon: 74.8723, name: 'Amritsar' },
  { lat: 23.2599, lon: 77.4126, name: 'Bhopal' },
  { lat: 26.1445, lon: 91.7362, name: 'Guwahati' },
  { lat: 30.7333, lon: 76.7794, name: 'Chandigarh' },
  { lat: 11.0168, lon: 76.9558, name: 'Coimbatore' },
];

console.log('Generating India spatial mock datasets...');

// 1. GENERATE H3 SCORES GEOJSON
function generateIndiaScores() {
  const seenCells = new Set();
  const features = [];

  // Regional Metro Cells
  for (const hub of HUBS) {
    const originCell = h3.latLngToCell(hub.lat, hub.lon, hub.res);
    const cells = h3.gridDisk(originCell, hub.ring);

    for (const cell of cells) {
      if (seenCells.has(cell)) continue;
      seenCells.add(cell);

      const boundary = h3.cellToBoundary(cell, true);
      const coordinates = [[...boundary, boundary[0]]];
      const [lat, lng] = h3.cellToLatLng(cell);

      const dist = Math.hypot(lat - hub.lat, lng - hub.lon);
      const noise = Math.sin(lat * 280) * 9 + Math.cos(lng * 280) * 9;
      const rawScore = hub.baseScore - (dist / 0.18) * 35 + noise;
      const score = Math.max(18, Math.min(99, Math.round(rawScore * 10) / 10));

      features.push({
        type: 'Feature',
        properties: {
          h3: cell,
          score,
          region: hub.name,
        },
        geometry: {
          type: 'Polygon',
          coordinates,
        },
      });
    }
  }

  // National Corridor Overview Cells (Res 6)
  for (const node of NATIONAL_NODES) {
    const originCell = h3.latLngToCell(node.lat, node.lon, 6);
    const cells = h3.gridDisk(originCell, 3);
    for (const cell of cells) {
      if (seenCells.has(cell)) continue;
      seenCells.add(cell);

      const boundary = h3.cellToBoundary(cell, true);
      const coordinates = [[...boundary, boundary[0]]];
      const [lat, lng] = h3.cellToLatLng(cell);
      const score = Math.round(55 + Math.sin(lat * 50) * 20 + Math.cos(lng * 50) * 15);

      features.push({
        type: 'Feature',
        properties: {
          h3: cell,
          score: Math.max(25, Math.min(95, score)),
          region: node.name,
        },
        geometry: {
          type: 'Polygon',
          coordinates,
        },
      });
    }
  }

  const geojson = { type: 'FeatureCollection', features };
  const dest = path.join(PUBLIC_DIR, 'mock_scores.geojson');
  fs.writeFileSync(dest, JSON.stringify(geojson), 'utf-8');
  console.log(`✓ Generated ${features.length} H3 cells in ${dest}`);
  return features;
}

// 2. GENERATE HOTSPOTS GEOJSON
function generateIndiaHotspots(scoreFeatures) {
  const hotspotFeatures = [];
  for (const f of scoreFeatures) {
    const score = f.properties.score;
    if (score >= 82) {
      hotspotFeatures.push({
        type: 'Feature',
        properties: {
          h3: f.properties.h3,
          score,
          z: +(2.0 + (score - 82) * 0.12).toFixed(2),
          type: 'hot',
        },
        geometry: f.geometry,
      });
    } else if (score <= 32) {
      hotspotFeatures.push({
        type: 'Feature',
        properties: {
          h3: f.properties.h3,
          score,
          z: +(-1.5 - (32 - score) * 0.08).toFixed(2),
          type: 'cold',
        },
        geometry: f.geometry,
      });
    }
  }

  const geojson = { type: 'FeatureCollection', features: hotspotFeatures };
  const dest = path.join(PUBLIC_DIR, 'mock_hotspots.geojson');
  fs.writeFileSync(dest, JSON.stringify(geojson), 'utf-8');
  console.log(`✓ Generated ${hotspotFeatures.length} Hotspots in ${dest}`);
}

// 3. GENERATE POIS GEOJSON
function generateIndiaPOIs() {
  const pois = [
    // Mumbai
    { name: 'Bandra Kurla Complex (BKC)', cat: 'financial', lon: 72.8687, lat: 19.0657 },
    { name: 'Chhatrapati Shivaji Maharaj Intl Airport', cat: 'transit', lon: 72.8656, lat: 19.0896 },
    { name: 'Jawaharlal Nehru Port (JNPT)', cat: 'logistics', lon: 72.9500, lat: 18.9500 },
    { name: 'Phoenix Marketcity Kurla', cat: 'retail', lon: 72.8890, lat: 19.0863 },
    { name: 'Mindspace Malad Tech Hub', cat: 'tech', lon: 72.8350, lat: 19.1760 },
    { name: 'Navi Mumbai Infotech Corridor', cat: 'tech', lon: 73.0167, lat: 19.0833 },
    // Delhi NCR
    { name: 'DLF CyberCity Gurugram', cat: 'tech', lon: 77.0880, lat: 28.4950 },
    { name: 'Connaught Place Commercial Core', cat: 'retail', lon: 77.2167, lat: 28.6315 },
    { name: 'Indira Gandhi Intl Airport (DEL)', cat: 'transit', lon: 77.1000, lat: 28.5562 },
    { name: 'Noida Electronic City SEZ', cat: 'tech', lon: 77.3710, lat: 28.6280 },
    { name: 'Select CITYWALK Saket', cat: 'retail', lon: 77.2185, lat: 28.5284 },
    { name: 'Farrukhnagar Multimodal Logistics Hub', cat: 'logistics', lon: 76.8200, lat: 28.4500 },
    // Bengaluru
    { name: 'Manyata Tech Park', cat: 'tech', lon: 77.6200, lat: 13.0450 },
    { name: 'Whitefield IT & Export Zone', cat: 'tech', lon: 77.7499, lat: 12.9716 },
    { name: 'Electronic City Phase 1', cat: 'tech', lon: 77.6650, lat: 12.8450 },
    { name: 'Kempegowda Intl Airport (BLR)', cat: 'transit', lon: 77.7066, lat: 13.1986 },
    { name: 'Outer Ring Road (ORR) Commercial Bellandur', cat: 'retail', lon: 77.6800, lat: 12.9300 },
    // Hyderabad
    { name: 'HITEC City Cyber Towers', cat: 'tech', lon: 78.3750, lat: 17.4500 },
    { name: 'Gachibowli Financial District', cat: 'financial', lon: 78.3480, lat: 17.4180 },
    { name: 'Rajiv Gandhi Intl Airport (HYD)', cat: 'transit', lon: 78.4300, lat: 17.2400 },
    { name: 'Inorbit Mall Madhapur', cat: 'retail', lon: 78.3880, lat: 17.4350 },
    // Gujarat
    { name: 'GIFT City International FinTech Zone', cat: 'financial', lon: 72.6840, lat: 23.1610 },
    { name: 'SG Highway Commercial Corridor', cat: 'retail', lon: 72.5050, lat: 23.0300 },
    { name: 'Sanand Industrial Mega Park', cat: 'logistics', lon: 72.3800, lat: 22.9800 },
    // Chennai
    { name: 'OMR IT Expressway Thoraipakkam', cat: 'tech', lon: 80.2350, lat: 12.9400 },
    { name: 'Sriperumbudur Auto Cluster', cat: 'logistics', lon: 79.9400, lat: 12.9600 },
    { name: 'Chennai Intl Airport (MAA)', cat: 'transit', lon: 80.1700, lat: 12.9940 },
    // Kolkata
    { name: 'Salt Lake Sector V IT Hub', cat: 'tech', lon: 88.4330, lat: 22.5760 },
    { name: 'New Town Commercial Center', cat: 'financial', lon: 88.4680, lat: 22.5850 },
    // Pune
    { name: 'Hinjawadi Rajiv Gandhi Infotech Park', cat: 'tech', lon: 73.7250, lat: 18.5950 },
    { name: 'Chakan Auto Manufacturing Corridor', cat: 'logistics', lon: 73.8500, lat: 18.7600 },
  ];

  const features = pois.map((p, idx) => ({
    type: 'Feature',
    properties: {
      id: `poi_ind_${idx}`,
      type: p.cat,
      category: p.cat,
      name: p.name,
    },
    geometry: {
      type: 'Point',
      coordinates: [p.lon, p.lat],
    },
  }));

  const geojson = { type: 'FeatureCollection', features };
  const dest = path.join(PUBLIC_DIR, 'mock_pois.geojson');
  fs.writeFileSync(dest, JSON.stringify(geojson, null, 2), 'utf-8');
  console.log(`✓ Generated ${features.length} POIs in ${dest}`);
}

// 4. GENERATE TRANSIT GEOJSON
function generateIndiaTransit() {
  const transitStops = [
    // Delhi Metro
    { name: 'Rajiv Chowk Metro (Yellow/Blue)', route: 'Blue & Yellow Line', lon: 77.2185, lat: 28.6328 },
    { name: 'Hauz Khas Metro (Yellow/Magenta)', route: 'Magenta Line', lon: 77.2064, lat: 28.5434 },
    { name: 'Cyber City Rapid Metro', route: 'Gurugram Rapid Metro', lon: 77.0890, lat: 28.4930 },
    { name: 'Noida Sector 18 Metro', route: 'Blue Line', lon: 77.3240, lat: 28.5700 },
    { name: 'New Delhi Railway Station (IR / Airport Express)', route: 'Airport Express', lon: 77.2210, lat: 28.6430 },
    // Mumbai Metro & Local Trains
    { name: 'Ghatkopar Metro & Suburban', route: 'Line 1 & Central Railway', lon: 72.9080, lat: 19.0860 },
    { name: 'Andheri Metro & Western Suburban', route: 'Line 1 & Western Railway', lon: 72.8470, lat: 19.1190 },
    { name: 'BKC Metro Station (Line 3 Aqua)', route: 'Line 3 Underground', lon: 72.8680, lat: 19.0660 },
    { name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', route: 'Harbour / Central Main', lon: 72.8350, lat: 18.9400 },
    { name: 'Dadar Junction Intercity Interchange', route: 'Western & Central Main', lon: 72.8420, lat: 19.0180 },
    // Bengaluru Namma Metro
    { name: 'Nadaprabhu Kempegowda Majestic Metro', route: 'Purple & Green Line Interchange', lon: 77.5720, lat: 12.9780 },
    { name: 'MG Road Metro', route: 'Purple Line', lon: 77.6060, lat: 12.9750 },
    { name: 'Indiranagar Metro', route: 'Purple Line', lon: 77.6380, lat: 12.9780 },
    { name: 'Whitefield (Kadugodi) Metro', route: 'Purple Line Extension', lon: 77.7600, lat: 12.9960 },
    { name: 'Silk Board Multi-Modal Interchange', route: 'Yellow & Blue Line', lon: 77.6240, lat: 12.9170 },
    // Hyderabad Metro
    { name: 'Ameerpet Metro Interchange', route: 'Red & Blue Line', lon: 78.4480, lat: 17.4370 },
    { name: 'HITEC City Metro Station', route: 'Blue Line', lon: 78.3770, lat: 17.4490 },
    { name: 'Raidurg Terminus', route: 'Blue Line Extension', lon: 78.3750, lat: 17.4380 },
    // Ahmedabad & Gandhinagar Metro
    { name: 'Kalupur Railway Station Metro', route: 'East-West Corridor', lon: 72.6010, lat: 23.0230 },
    { name: 'Thaltej Metro Station', route: 'East-West Corridor', lon: 72.5150, lat: 23.0510 },
    { name: 'GIFT City Metro Hub', route: 'Phase 2 North Extension', lon: 72.6850, lat: 23.1630 },
    // Chennai Metro
    { name: 'Puratchi Thalaivar Dr. MGR Central Metro', route: 'Blue & Green Line', lon: 80.2750, lat: 13.0820 },
    { name: 'Guindy Metro Interchange', route: 'Blue Line', lon: 80.2120, lat: 13.0080 },
    // Kolkata Metro
    { name: 'Salt Lake Sector V Metro', route: 'Green Line (East-West)', lon: 88.4310, lat: 22.5800 },
    { name: 'Esplanade Metro Interchange', route: 'Blue & Green Line', lon: 88.3510, lat: 22.5640 },
  ];

  const features = transitStops.map((t, idx) => ({
    type: 'Feature',
    properties: {
      id: `transit_ind_${idx}`,
      name: t.name,
      route: t.route,
    },
    geometry: {
      type: 'Point',
      coordinates: [t.lon, t.lat],
    },
  }));

  const geojson = { type: 'FeatureCollection', features };
  const dest = path.join(PUBLIC_DIR, 'mock_transit.geojson');
  fs.writeFileSync(dest, JSON.stringify(geojson, null, 2), 'utf-8');
  console.log(`✓ Generated ${features.length} Transit Stops in ${dest}`);
}

// 5. GENERATE ROADS / HIGHWAYS GEOJSON
function generateIndiaRoads() {
  const roads = [
    {
      name: 'Delhi-Mumbai Expressway (NE-4)',
      class: 'motorway',
      coordinates: [
        [77.05, 28.45],
        [76.85, 27.80],
        [76.25, 26.90],
        [75.80, 25.10],
        [74.50, 23.30],
        [73.20, 21.20],
        [72.90, 19.25],
      ],
    },
    {
      name: 'Mumbai-Pune Expressway',
      class: 'motorway',
      coordinates: [
        [73.02, 19.02],
        [73.18, 18.90],
        [73.40, 18.75],
        [73.65, 18.68],
        [73.80, 18.55],
      ],
    },
    {
      name: 'Western Express Highway (Mumbai)',
      class: 'primary',
      coordinates: [
        [72.84, 19.05],
        [72.85, 19.10],
        [72.86, 19.18],
        [72.86, 19.25],
      ],
    },
    {
      name: 'Eastern Freeway (Mumbai)',
      class: 'primary',
      coordinates: [
        [72.83, 18.94],
        [72.86, 19.00],
        [72.89, 19.05],
      ],
    },
    {
      name: 'Outer Ring Road (Delhi)',
      class: 'trunk',
      coordinates: [
        [77.10, 28.65],
        [77.15, 28.55],
        [77.25, 28.54],
        [77.30, 28.62],
        [77.20, 28.72],
        [77.10, 28.65],
      ],
    },
    {
      name: 'Bengaluru Outer Ring Road (ORR)',
      class: 'trunk',
      coordinates: [
        [77.55, 13.02],
        [77.62, 13.04],
        [77.68, 12.98],
        [77.69, 12.92],
        [77.62, 12.91],
        [77.56, 12.92],
      ],
    },
    {
      name: 'Hyderabad Nehru Outer Ring Road (ORR)',
      class: 'motorway',
      coordinates: [
        [78.30, 17.45],
        [78.40, 17.60],
        [78.60, 17.45],
        [78.50, 17.25],
        [78.35, 17.30],
        [78.30, 17.45],
      ],
    },
    {
      name: 'SG Highway (Ahmedabad - Gandhinagar)',
      class: 'primary',
      coordinates: [
        [72.50, 22.98],
        [72.51, 23.04],
        [72.53, 23.10],
        [72.57, 23.18],
        [72.63, 23.22],
      ],
    },
    {
      name: 'Old Mahabalipuram Road (OMR / IT Corridor Chennai)',
      class: 'primary',
      coordinates: [
        [80.25, 13.00],
        [80.24, 12.94],
        [80.23, 12.87],
        [80.22, 12.80],
      ],
    },
  ];

  const features = roads.map((r) => ({
    type: 'Feature',
    properties: { name: r.name, class: r.class },
    geometry: { type: 'LineString', coordinates: r.coordinates },
  }));

  const geojson = { type: 'FeatureCollection', features };
  const dest = path.join(PUBLIC_DIR, 'mock_roads.geojson');
  fs.writeFileSync(dest, JSON.stringify(geojson, null, 2), 'utf-8');
  console.log(`✓ Generated ${features.length} Highways in ${dest}`);
}

// 6. GENERATE FLOODPLAIN GEOJSON
function generateIndiaFlood() {
  const floodZones = [
    {
      id: 'fz_mithi',
      label: 'Mithi River Monsoon Flood Buffer (Mumbai)',
      coordinates: [
        [72.87, 19.06],
        [72.88, 19.07],
        [72.89, 19.08],
        [72.885, 19.09],
        [72.875, 19.075],
        [72.87, 19.06],
      ],
    },
    {
      id: 'fz_yamuna',
      label: 'Yamuna Floodplain Wetland Corridor (Delhi)',
      coordinates: [
        [77.24, 28.70],
        [77.26, 28.66],
        [77.28, 28.60],
        [77.30, 28.55],
        [77.28, 28.55],
        [77.25, 28.62],
        [77.23, 28.70],
        [77.24, 28.70],
      ],
    },
    {
      id: 'fz_bellandur',
      label: 'Bellandur & Varthur Lake Wetland Basin (Bengaluru)',
      coordinates: [
        [77.66, 12.93],
        [77.72, 12.95],
        [77.74, 12.94],
        [77.70, 12.92],
        [77.66, 12.93],
      ],
    },
    {
      id: 'fz_cooum',
      label: 'Adyar & Cooum Coastal Inundation Zone (Chennai)',
      coordinates: [
        [80.24, 13.01],
        [80.28, 13.01],
        [80.27, 12.99],
        [80.23, 12.99],
        [80.24, 13.01],
      ],
    },
  ];

  const features = floodZones.map((fz) => ({
    type: 'Feature',
    properties: {
      id: fz.id,
      zone: 'AE',
      risk: 'high',
      label: fz.label,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [fz.coordinates],
    },
  }));

  const geojson = { type: 'FeatureCollection', features };
  const dest = path.join(PUBLIC_DIR, 'mock_flood.geojson');
  fs.writeFileSync(dest, JSON.stringify(geojson, null, 2), 'utf-8');
  console.log(`✓ Generated ${features.length} Flood Zones in ${dest}`);
}

const scoreFeatures = generateIndiaScores();
generateIndiaHotspots(scoreFeatures);
generateIndiaPOIs();
generateIndiaTransit();
generateIndiaRoads();
generateIndiaFlood();

console.log('✓ All Indian GeoJSON datasets successfully generated in public/ folder!');
