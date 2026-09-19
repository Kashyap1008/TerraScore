import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as h3 from 'h3-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CENTER_LON = -97.7431;
const CENTER_LAT = 30.2672;
const RING_SIZE = 12;
const RESOLUTION = 9;

function generateScores() {
  const originCell = h3.latLngToCell(CENTER_LAT, CENTER_LON, RESOLUTION);
  const cells = h3.gridDisk(originCell, RING_SIZE);

  const features = cells.map((cell) => {
    const boundary = h3.cellToBoundary(cell, true);
    const coordinates = [[...boundary, boundary[0]]];
    const [lat, lng] = h3.cellToLatLng(cell);

    const dist = Math.hypot(lat - CENTER_LAT, lng - CENTER_LON);
    const noise = Math.sin(lat * 350) * 8 + Math.cos(lng * 350) * 8;
    const rawScore = 95 - (dist / 0.08) * 45 + noise;
    const score = Math.max(12, Math.min(99, Math.round(rawScore * 10) / 10));

    return {
      type: 'Feature' as const,
      properties: {
        h3: cell,
        score,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates,
      },
    };
  });

  const geojson = {
    type: 'FeatureCollection' as const,
    features,
  };

  const outputPath = path.resolve(__dirname, '../../public/mock_scores.geojson');
  fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2), 'utf-8');
  console.log(`Wrote ${features.length} H3 features to ${outputPath}`);
}

generateScores();
