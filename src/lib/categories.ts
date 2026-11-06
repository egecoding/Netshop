// Shared category metadata used by both the seed script and runtime code
// (e.g. the placeholder image endpoint derives a category label from a SKU's code segment).

export interface CategoryDef {
  slug: string;
  name: string;
  code: string; // 3-letter code embedded in SKUs, e.g. NS-SEC-003
  description: string;
  sortOrder: number;
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: 'cpe-radios',
    name: 'CPE & PtMP Radios',
    code: 'CPE',
    description: 'Subscriber-side outdoor radios for point-to-multipoint wireless networks.',
    sortOrder: 1,
  },
  {
    slug: 'backhaul-radios',
    name: 'Backhaul Radios',
    code: 'BHR',
    description: 'High-capacity point-to-point links for tower-to-tower backhaul.',
    sortOrder: 2,
  },
  {
    slug: 'sector-antennas',
    name: 'Sector Antennas',
    code: 'SEC',
    description: 'Directional sector antennas for PtMP base station coverage.',
    sortOrder: 3,
  },
  {
    slug: 'omni-yagi-antennas',
    name: 'Omni & Yagi Antennas',
    code: 'OMN',
    description: 'Omnidirectional and Yagi antennas for coverage and CPE installs.',
    sortOrder: 4,
  },
  {
    slug: 'routers-gateways',
    name: 'Routers & Gateways',
    code: 'RTR',
    description: 'Edge routers and gateways for subscriber and core networks.',
    sortOrder: 5,
  },
  {
    slug: 'poe-switches',
    name: 'Managed PoE Switches',
    code: 'SWT',
    description: 'Managed switches with PoE/PoE+/PoE++ budgets for powering outdoor gear.',
    sortOrder: 6,
  },
  {
    slug: 'poe-injectors',
    name: 'PoE Injectors & Splitters',
    code: 'POE',
    description: 'Single-port PoE injectors, splitters, and adapters.',
    sortOrder: 7,
  },
  {
    slug: 'fiber-transceivers',
    name: 'Fiber Transceivers (SFP/SFP+)',
    code: 'SFP',
    description: 'SFP and SFP+ optical transceivers for fiber uplinks.',
    sortOrder: 8,
  },
  {
    slug: 'outdoor-cabling',
    name: 'Outdoor & Weatherproof Cabling',
    code: 'CAB',
    description: 'UV-rated Ethernet and fiber cabling built for outdoor runs.',
    sortOrder: 9,
  },
  {
    slug: 'towers-mounting',
    name: 'Towers, Masts & Mounting',
    code: 'TWR',
    description: 'Masts, mounts, and hardware for tower and rooftop installs.',
    sortOrder: 10,
  },
  {
    slug: 'surge-grounding',
    name: 'Surge Protection & Grounding',
    code: 'SRG',
    description: 'Surge suppressors and grounding kits for lightning protection.',
    sortOrder: 11,
  },
  {
    slug: 'power-backup',
    name: 'Power, Solar & Battery Backup',
    code: 'PWR',
    description: 'Power supplies, solar charge controllers, and battery backup gear.',
    sortOrder: 12,
  },
  {
    slug: 'test-tools',
    name: 'Network Test & Install Tools',
    code: 'TST',
    description: 'Cable testers, spectrum analyzers, and installer hand tools.',
    sortOrder: 13,
  },
];

export function categoryNameFromSku(sku: string): string {
  const code = sku.split('-')[1];
  const match = CATEGORIES.find((c) => c.code === code);
  return match?.name ?? 'NetShop';
}

const CATEGORY_ICONS: Record<string, string> = {
  CPE: '📡',
  BHR: '🛰️',
  SEC: '📶',
  OMN: '📡',
  RTR: '🌐',
  SWT: '🔌',
  POE: '⚡',
  SFP: '💡',
  CAB: '🧵',
  TWR: '🗼',
  SRG: '🛡️',
  PWR: '🔋',
  TST: '🧰',
};

export function categoryIcon(code: string): string {
  return CATEGORY_ICONS[code] ?? '🛒';
}

export function categoryIconBySlug(slug: string): string {
  const match = CATEGORIES.find((c) => c.slug === slug);
  return match ? categoryIcon(match.code) : '🛒';
}
