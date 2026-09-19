import * as h3 from 'h3-js';

export interface LocationInfo {
  name: string;
  submarket: string;
  coordsFormatted: string;
  lat: number;
  lon: number;
  h3Short: string;
}

interface AnchorPoint {
  name: string;
  submarket: string;
  lat: number;
  lon: number;
  maxDistKm?: number;
}

const AUSTIN_NEIGHBORHOODS: AnchorPoint[] = [
  { name: 'Downtown Austin / 6th & Congress', submarket: 'Urban Core', lat: 30.2672, lon: -97.7431, maxDistKm: 1.6 },
  { name: 'Texas Capitol & Univ. Corridor', submarket: 'Downtown North', lat: 30.2747, lon: -97.7404, maxDistKm: 1.4 },
  { name: 'UT Austin / West Campus', submarket: 'Campus District', lat: 30.2850, lon: -97.7340, maxDistKm: 1.8 },
  { name: 'Rainey Street / Lady Bird Lake', submarket: 'Waterfront / Historic', lat: 30.2580, lon: -97.7380, maxDistKm: 1.5 },
  { name: 'South Congress / SoCo', submarket: 'Commercial & Retail', lat: 30.2450, lon: -97.7510, maxDistKm: 2.2 },
  { name: 'South Lamar / Bouldin Creek', submarket: 'South Central', lat: 30.2500, lon: -97.7650, maxDistKm: 2.0 },
  { name: 'Zilker Park / Barton Springs', submarket: 'Southwest Central', lat: 30.2630, lon: -97.7700, maxDistKm: 2.2 },
  { name: 'East Austin / Plaza Saltillo', submarket: 'East Metro', lat: 30.2620, lon: -97.7180, maxDistKm: 2.2 },
  { name: 'Mueller Urban District', submarket: 'Northeast Mixed-Use', lat: 30.2980, lon: -97.7050, maxDistKm: 2.5 },
  { name: 'Hyde Park / North Loop', submarket: 'Central North', lat: 30.3150, lon: -97.7300, maxDistKm: 2.2 },
  { name: 'The Domain / North Tech Hub', submarket: 'North Tech Corridor', lat: 30.4020, lon: -97.7250, maxDistKm: 3.0 },
  { name: 'Arboretum / Great Hills', submarket: 'Northwest Tech', lat: 30.3950, lon: -97.7500, maxDistKm: 2.8 },
  { name: 'West Lake Hills / Rollingwood', submarket: 'West Austin Hills', lat: 30.2750, lon: -97.8050, maxDistKm: 3.5 },
  { name: 'Tarrytown / Lake Austin', submarket: 'West Central', lat: 30.2950, lon: -97.7750, maxDistKm: 2.5 },
  { name: 'Oak Hill / SW Parkway', submarket: 'Southwest Corridor', lat: 30.2200, lon: -97.8300, maxDistKm: 4.0 },
  { name: 'Sunset Valley / Brodie Lane', submarket: 'South Austin Retail', lat: 30.2250, lon: -97.8100, maxDistKm: 3.0 },
  { name: 'Circle C Ranch / Slaughter Ln', submarket: 'Southwest Submarket', lat: 30.1900, lon: -97.8800, maxDistKm: 4.5 },
  { name: 'Riverside / South Shore', submarket: 'Southeast Corridor', lat: 30.2400, lon: -97.7200, maxDistKm: 2.5 },
  { name: 'Montopolis / Airport Freeway', submarket: 'Southeast Industrial', lat: 30.2300, lon: -97.6950, maxDistKm: 3.0 },
  { name: 'Airport Hub (ABIA / Cargo)', submarket: 'ABIA Logistics Zone', lat: 30.2000, lon: -97.6700, maxDistKm: 4.5 },
  { name: 'Del Valle / COTA Corridor', submarket: 'Southeast Metro', lat: 30.1800, lon: -97.6300, maxDistKm: 5.5 },
  { name: 'Round Rock / North Metro', submarket: 'North Submarket', lat: 30.5050, lon: -97.6800, maxDistKm: 6.0 },
  { name: 'Pflugerville / Tech Corridor', submarket: 'Northeast Submarket', lat: 30.4500, lon: -97.6200, maxDistKm: 5.5 },
  { name: 'Cedar Park / 183A Tollway', submarket: 'Northwest Submarket', lat: 30.5050, lon: -97.8200, maxDistKm: 6.0 },
  { name: 'Lakeline / Anderson Mill', submarket: 'Northwest Commercial', lat: 30.4700, lon: -97.7900, maxDistKm: 3.5 },
  { name: 'Wells Branch / Tech Ridge', submarket: 'North Metro Industrial', lat: 30.4400, lon: -97.6700, maxDistKm: 4.0 },
  { name: 'Bee Cave / Galleria', submarket: 'Hill Country Galleria', lat: 30.3100, lon: -97.9400, maxDistKm: 6.0 },
  { name: 'Lakeway / Lake Travis', submarket: 'Lake Travis Submarket', lat: 30.3600, lon: -97.9800, maxDistKm: 7.0 },
  { name: 'Buda / South I-35', submarket: 'South Corridor', lat: 30.0800, lon: -97.8300, maxDistKm: 6.0 },
  { name: 'Kyle / South Metro', submarket: 'South Expansion Zone', lat: 30.0000, lon: -97.8700, maxDistKm: 7.0 },
  { name: 'Manor / US-290 East', submarket: 'East Expansion Zone', lat: 30.3400, lon: -97.5500, maxDistKm: 6.0 },
];

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats lat/lon into clean, professional GPS string (e.g. "30.267° N, 97.743° W")
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  const latStr = Math.abs(lat).toFixed(3);
  const lonStr = Math.abs(lon).toFixed(3);
  return `${latStr}° ${latDir}, ${lonStr}° ${lonDir}`;
}

/**
 * Resolves a human-readable location name, submarket, and coordinates for any given lat/lon or H3 index.
 */
export function resolveLocationName(
  lat?: number | null,
  lon?: number | null,
  h3Index?: string | null
): LocationInfo {
  let finalLat = lat ?? 0;
  let finalLon = lon ?? 0;

  if ((!lat || !lon) && h3Index) {
    try {
      const [hLat, hLon] = h3.cellToLatLng(h3Index);
      finalLat = hLat;
      finalLon = hLon;
    } catch {
      // Fallback if cellToLatLng fails
    }
  }

  const h3Short = h3Index ? (h3Index.length > 8 ? `${h3Index.slice(0, 8)}…` : h3Index) : '';
  const coordsFormatted = formatCoordinates(finalLat, finalLon);

  // Find nearest anchor
  let closest: AnchorPoint | null = null;
  let minDistance = Infinity;

  for (const anchor of AUSTIN_NEIGHBORHOODS) {
    const dist = getDistanceKm(finalLat, finalLon, anchor.lat, anchor.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = anchor;
    }
  }

  if (closest) {
    const maxThreshold = closest.maxDistKm ?? 3.5;
    if (minDistance <= maxThreshold) {
      return {
        name: closest.name,
        submarket: closest.submarket,
        coordsFormatted,
        lat: finalLat,
        lon: finalLon,
        h3Short,
      };
    } else {
      // Directional relative to closest submarket
      const dLat = finalLat - closest.lat;
      const dLon = finalLon - closest.lon;
      let dir = '';
      if (dLat > 0.01) dir += 'North';
      else if (dLat < -0.01) dir += 'South';
      if (dLon > 0.01) dir += dir ? 'east' : 'East';
      else if (dLon < -0.01) dir += dir ? 'west' : 'West';

      const prefix = dir ? `${dir} of ` : 'Near ';
      return {
        name: `${prefix}${closest.name}`,
        submarket: closest.submarket,
        coordsFormatted,
        lat: finalLat,
        lon: finalLon,
        h3Short,
      };
    }
  }

  return {
    name: 'Austin Metro Area',
    submarket: 'Greater Austin Region',
    coordsFormatted,
    lat: finalLat,
    lon: finalLon,
    h3Short,
  };
}
