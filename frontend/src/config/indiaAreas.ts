export interface IndiaArea {
  id: string;
  name: string;
  shortName: string;
  state: string;
  center: [number, number]; // [lon, lat]
  zoom: number;
  description: string;
  category: 'national' | 'state' | 'district' | 'metro';
}

export const INDIA_AREAS: IndiaArea[] = [
  {
    id: 'all_india',
    name: 'ALL INDIA',
    shortName: 'INDIA',
    state: 'National',
    center: [78.9629, 22.5937],
    zoom: 4.8,
    description: 'National Economic & Infrastructure Grid',
    category: 'national'
  },
  {
    id: 'maharashtra_mumbai',
    name: 'MAHARASHTRA / MUMBAI & MMR',
    shortName: 'MUMBAI',
    state: 'Maharashtra',
    center: [72.8777, 19.0760],
    zoom: 11.2,
    description: 'Financial Capital, BKC, Navi Mumbai, Thane & JNPT',
    category: 'metro'
  },
  {
    id: 'delhi_ncr',
    name: 'DELHI NCR / GURUGRAM & NOIDA',
    shortName: 'DELHI NCR',
    state: 'Delhi / Haryana / UP',
    center: [77.2090, 28.6139],
    zoom: 11.0,
    description: 'National Capital Region, Cyber Hub, Noida Expressway',
    category: 'metro'
  },
  {
    id: 'karnataka_bengaluru',
    name: 'KARNATAKA / BENGALURU',
    shortName: 'BENGALURU',
    state: 'Karnataka',
    center: [77.5946, 12.9716],
    zoom: 11.3,
    description: 'Tech Hub, Outer Ring Road, Whitefield & Electronic City',
    category: 'metro'
  },
  {
    id: 'telangana_hyderabad',
    name: 'TELANGANA / HYDERABAD',
    shortName: 'HYDERABAD',
    state: 'Telangana',
    center: [78.4867, 17.3850],
    zoom: 11.2,
    description: 'HITEC City, Gachibowli Financial District & Pharma City',
    category: 'metro'
  },
  {
    id: 'gujarat_ahmedabad',
    name: 'GUJARAT / AHMEDABAD & GIFT CITY',
    shortName: 'AHMEDABAD / GIFT',
    state: 'Gujarat',
    center: [72.5714, 23.0225],
    zoom: 11.2,
    description: 'GIFT City International FinTech Hub & Sanand Auto Cluster',
    category: 'metro'
  },
  {
    id: 'tamilnadu_chennai',
    name: 'TAMIL NADU / CHENNAI',
    shortName: 'CHENNAI',
    state: 'Tamil Nadu',
    center: [80.2707, 13.0827],
    zoom: 11.2,
    description: 'Automobile & SaaS Hub, OMR IT Corridor, Sriperumbudur',
    category: 'metro'
  },
  {
    id: 'westbengal_kolkata',
    name: 'WEST BENGAL / KOLKATA',
    shortName: 'KOLKATA',
    state: 'West Bengal',
    center: [88.3639, 22.5726],
    zoom: 11.2,
    description: 'Eastern Commercial Gateway, Salt Lake Sector V, New Town',
    category: 'metro'
  },
  {
    id: 'pune_maharashtra',
    name: 'MAHARASHTRA / PUNE',
    shortName: 'PUNE',
    state: 'Maharashtra',
    center: [73.8567, 18.5204],
    zoom: 11.5,
    description: 'Hinjawadi IT Park, Chakan Manufacturing Hub',
    category: 'district'
  }
];
