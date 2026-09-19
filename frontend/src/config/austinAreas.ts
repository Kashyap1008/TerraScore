export interface AustinArea {
  id: string;
  name: string;
  shortName: string;
  center: [number, number]; // [lon, lat]
  zoom: number;
  description: string;
}

export const AUSTIN_AREAS: AustinArea[] = [
  { id: 'all', name: 'ALL METRO', shortName: 'ALL', center: [-97.7431, 30.2672], zoom: 11, description: 'Austin Metro Coverage' },
  { id: 'downtown', name: 'DOWNTOWN', shortName: 'DOWNTOWN', center: [-97.7431, 30.2672], zoom: 14.2, description: 'Capitol & Urban Core' },
  { id: 'domain', name: 'THE DOMAIN', shortName: 'DOMAIN', center: [-97.7250, 30.4020], zoom: 14.5, description: 'North Tech & Retail Hub' },
  { id: 'south_congress', name: 'S. CONGRESS', shortName: 'SOCO', center: [-97.7510, 30.2450], zoom: 14.2, description: 'Commercial & High Street' },
  { id: 'mueller', name: 'MUELLER', shortName: 'MUELLER', center: [-97.7050, 30.2980], zoom: 14.5, description: 'Planned Urban Mixed-Use' },
  { id: 'east_austin', name: 'EAST AUSTIN', shortName: 'EAST', center: [-97.7180, 30.2620], zoom: 14.2, description: 'Fast-Growing Corridor' },
  { id: 'round_rock', name: 'ROUND ROCK', shortName: 'ROUND ROCK', center: [-97.6800, 30.5050], zoom: 13.5, description: 'North Metro Submarket' },
  { id: 'airport', name: 'AIRPORT HUB', shortName: 'AIRPORT', center: [-97.6700, 30.2000], zoom: 13.8, description: 'ABIA Logistics Corridor' },
  { id: 'oak_hill', name: 'OAK HILL / SW', shortName: 'OAK HILL', center: [-97.8300, 30.2200], zoom: 13.5, description: 'Southwest Austin' },
];
