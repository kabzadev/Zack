/**
 * Sherwin-Williams Professional Paint Product Catalog
 * Organized by tier (Good → Better → Best → Premium)
 * Prices are typical contractor/retail pricing and may vary by location.
 */

export type ProductCategory = 'interior' | 'exterior' | 'primer' | 'specialty' | 'trim';
export type ProductTier = 'good' | 'better' | 'best' | 'premium';
export type FinishType = 'flat' | 'matte' | 'eg-shel' | 'satin' | 'semi-gloss' | 'gloss' | 'high-gloss';

export interface SWProduct {
  id: string;
  name: string;
  fullName: string;
  category: ProductCategory;
  tier: ProductTier;
  priceRange: { low: number; high: number };  // per gallon
  coverage: number;  // sq ft per gallon
  finishes: FinishType[];
  primerBuiltIn: boolean;
  benefits: string[];
  bestFor: string;
  notes?: string;
}

export const SW_PRODUCTS: SWProduct[] = [
  // ============ INTERIOR PAINTS ============
  // --- Good Tier ---
  {
    id: 'property-solutions',
    name: 'Property Solutions',
    fullName: 'Property Solutions Interior Latex',
    category: 'interior',
    tier: 'good',
    priceRange: { low: 28, high: 35 },
    coverage: 400,
    finishes: ['flat', 'eg-shel', 'semi-gloss'],
    primerBuiltIn: false,
    benefits: [
      'Budget-friendly for multi-unit & rental properties',
      'Good touch-up capability',
      'Low VOC',
    ],
    bestFor: 'Rental properties, apartments, budget repaints',
  },
  {
    id: 'promar-200',
    name: 'ProMar 200',
    fullName: 'ProMar 200 Zero VOC Interior Latex',
    category: 'interior',
    tier: 'good',
    priceRange: { low: 32, high: 42 },
    coverage: 400,
    finishes: ['flat', 'eg-shel', 'satin', 'semi-gloss'],
    primerBuiltIn: false,
    benefits: [
      'Zero VOC — safe for occupied spaces',
      'Smooth application and leveling',
      'Good hide and coverage',
      'Industry workhorse for contractors',
    ],
    bestFor: 'Commercial, residential repaints, occupied spaces',
  },
  // --- Better Tier ---
  {
    id: 'superpaint',
    name: 'SuperPaint',
    fullName: 'SuperPaint Interior Acrylic Latex',
    category: 'interior',
    tier: 'better',
    priceRange: { low: 50, high: 62 },
    coverage: 400,
    finishes: ['flat', 'matte', 'eg-shel', 'satin', 'semi-gloss'],
    primerBuiltIn: true,
    benefits: [
      'Paint + primer in one — saves a coat',
      'Excellent hide and coverage',
      'Washable and scrubbable',
      'Great flow and leveling',
      'Most popular SW paint for contractors',
    ],
    bestFor: 'Residential repaints, general interior work',
  },
  {
    id: 'cashmere',
    name: 'Cashmere',
    fullName: 'Cashmere Interior Acrylic Latex',
    category: 'interior',
    tier: 'better',
    priceRange: { low: 55, high: 68 },
    coverage: 400,
    finishes: ['flat', 'matte', 'eg-shel', 'satin', 'semi-gloss'],
    primerBuiltIn: true,
    benefits: [
      'Buttery smooth application',
      'Exceptional flow and leveling — fewer brush marks',
      'Paint + primer in one',
      'Low splatter',
      'Rich, luxurious finish',
    ],
    bestFor: 'High-end residential, smooth finishes, homeowner upgrades',
  },
  // --- Best Tier ---
  {
    id: 'duration-home',
    name: 'Duration Home',
    fullName: 'Duration Home Interior Acrylic Latex',
    category: 'interior',
    tier: 'best',
    priceRange: { low: 62, high: 75 },
    coverage: 400,
    finishes: ['flat', 'matte', 'eg-shel', 'satin', 'semi-gloss'],
    primerBuiltIn: true,
    benefits: [
      'Moisture-resistant in all sheens including flat',
      'Outstanding hide — often one coat',
      'Scrubbable in every finish',
      'Paint + primer in one',
      'Antimicrobial mildew resistance',
    ],
    bestFor: 'Kitchens, bathrooms, high-traffic areas, families with kids',
  },
  // --- Premium Tier ---
  {
    id: 'emerald-interior',
    name: 'Emerald',
    fullName: 'Emerald Interior Acrylic Latex',
    category: 'interior',
    tier: 'premium',
    priceRange: { low: 80, high: 95 },
    coverage: 400,
    finishes: ['flat', 'matte', 'satin', 'semi-gloss'],
    primerBuiltIn: true,
    benefits: [
      'SW\'s top-of-the-line interior paint',
      'True one-coat coverage in most colors',
      'Advanced stain-blocking technology',
      'Washable flat — looks flat, cleans like satin',
      'Exceptional durability and color retention',
      'Self-priming',
      'Low VOC',
    ],
    bestFor: 'Premium residential, showcase rooms, dark/bold colors, highest quality jobs',
  },
  {
    id: 'emerald-urethane',
    name: 'Emerald Urethane',
    fullName: 'Emerald Urethane Trim Enamel',
    category: 'trim',
    tier: 'premium',
    priceRange: { low: 85, high: 100 },
    coverage: 400,
    finishes: ['satin', 'semi-gloss', 'gloss'],
    primerBuiltIn: true,
    benefits: [
      'Urethane-modified for exceptional hardness',
      'Smooth, furniture-like finish',
      'Blocks stains — resists yellowing',
      'Levels like an oil-based paint',
      'Water-based cleanup',
      'Best trim paint SW makes',
    ],
    bestFor: 'Trim, doors, cabinets, high-end millwork',
  },

  // ============ EXTERIOR PAINTS ============
  // --- Good Tier ---
  {
    id: 'a-100',
    name: 'A-100',
    fullName: 'A-100 Exterior Acrylic Latex',
    category: 'exterior',
    tier: 'good',
    priceRange: { low: 38, high: 48 },
    coverage: 400,
    finishes: ['flat', 'satin', 'semi-gloss', 'gloss'],
    primerBuiltIn: false,
    benefits: [
      'Solid performance at a lower price',
      'Good adhesion and color retention',
      'Mildew resistant',
    ],
    bestFor: 'Budget exterior repaints, rental properties',
  },
  // --- Better Tier ---
  {
    id: 'superpaint-ext',
    name: 'SuperPaint Exterior',
    fullName: 'SuperPaint Exterior Acrylic Latex',
    category: 'exterior',
    tier: 'better',
    priceRange: { low: 52, high: 65 },
    coverage: 400,
    finishes: ['flat', 'satin', 'semi-gloss', 'gloss'],
    primerBuiltIn: true,
    benefits: [
      'Paint + primer in one',
      'Excellent adhesion',
      'Fade and mildew resistant',
      'Advanced resin technology',
      'Good flexibility — resists cracking',
    ],
    bestFor: 'Most residential exterior projects',
  },
  // --- Best Tier ---
  {
    id: 'duration-ext',
    name: 'Duration Exterior',
    fullName: 'Duration Exterior Acrylic Coating',
    category: 'exterior',
    tier: 'best',
    priceRange: { low: 70, high: 82 },
    coverage: 350,
    finishes: ['flat', 'satin', 'semi-gloss', 'gloss'],
    primerBuiltIn: true,
    benefits: [
      'PermaLast technology — locks color in',
      'Outstanding fade resistance',
      'Thick film build — fills small cracks',
      'Self-priming on most surfaces',
      'Mildew and algae resistant',
      'Lifetime limited warranty',
    ],
    bestFor: 'Premium exterior jobs, harsh weather, long-term durability',
  },
  // --- Premium Tier ---
  {
    id: 'emerald-ext',
    name: 'Emerald Exterior',
    fullName: 'Emerald Exterior Acrylic Latex',
    category: 'exterior',
    tier: 'premium',
    priceRange: { low: 82, high: 98 },
    coverage: 350,
    finishes: ['flat', 'satin', 'semi-gloss'],
    primerBuiltIn: true,
    benefits: [
      'SW\'s ultimate exterior paint',
      'Advanced UV and weather resistance',
      'Superior color retention',
      'Resists blistering and peeling',
      'Self-priming',
      'Extreme dirt resistance',
      'Best exterior paint on the market',
    ],
    bestFor: 'Highest quality exterior jobs, showcase properties, coastal/extreme climates',
  },
  {
    id: 'emerald-rain-refresh',
    name: 'Emerald Rain Refresh',
    fullName: 'Emerald Rain Refresh Exterior Acrylic',
    category: 'exterior',
    tier: 'premium',
    priceRange: { low: 88, high: 105 },
    coverage: 350,
    finishes: ['flat', 'satin'],
    primerBuiltIn: true,
    benefits: [
      'Self-cleaning technology — rain washes dirt away',
      'Hydrophobic finish repels water',
      'All Emerald Exterior benefits plus self-cleaning',
      'Best for light colors that show dirt',
    ],
    bestFor: 'White/light exterior homes, hard-to-clean surfaces, low maintenance',
  },

  // ============ PRIMERS ============
  {
    id: 'problock',
    name: 'ProBlock',
    fullName: 'ProBlock Interior/Exterior Primer',
    category: 'primer',
    tier: 'good',
    priceRange: { low: 38, high: 48 },
    coverage: 400,
    finishes: ['flat'],
    primerBuiltIn: false,
    benefits: [
      'Blocks stains and tannin bleed',
      'Excellent adhesion to most surfaces',
      'Interior/exterior use',
      'Good for spot priming',
    ],
    bestFor: 'General priming, new drywall, stain blocking',
  },
  {
    id: 'premium-wall-primer',
    name: 'Premium Wall & Wood',
    fullName: 'Premium Wall & Wood Interior/Exterior Primer',
    category: 'primer',
    tier: 'better',
    priceRange: { low: 42, high: 52 },
    coverage: 400,
    finishes: ['flat'],
    primerBuiltIn: false,
    benefits: [
      'Fills and seals porous surfaces',
      'Great for new drywall',
      'Sands smooth',
      'Interior/exterior',
    ],
    bestFor: 'New construction, bare wood, drywall',
  },
  {
    id: 'extreme-bond',
    name: 'Extreme Bond',
    fullName: 'Extreme Bond Interior/Exterior Primer',
    category: 'primer',
    tier: 'best',
    priceRange: { low: 55, high: 68 },
    coverage: 350,
    finishes: ['flat'],
    primerBuiltIn: false,
    benefits: [
      'Bonds to difficult surfaces — tile, glass, glossy finishes',
      'No sanding required on most surfaces',
      'Interior/exterior use',
      'Excellent for kitchen cabinets',
    ],
    bestFor: 'Slick surfaces, cabinets, tile, previously glossy surfaces',
  },

  // ============ TRIM & SPECIALTY ============
  {
    id: 'proclassic',
    name: 'ProClassic',
    fullName: 'ProClassic Interior Waterbased Acrylic-Alkyd',
    category: 'trim',
    tier: 'best',
    priceRange: { low: 65, high: 78 },
    coverage: 400,
    finishes: ['satin', 'semi-gloss', 'gloss'],
    primerBuiltIn: false,
    benefits: [
      'Alkyd-like finish with water cleanup',
      'Hard, durable film — great for high-touch areas',
      'Excellent flow and leveling',
      'Resists yellowing',
    ],
    bestFor: 'Trim, doors, baseboards, railings, cabinets',
  },
  {
    id: 'pro-industrial',
    name: 'Pro Industrial',
    fullName: 'Pro Industrial DTM Acrylic',
    category: 'specialty',
    tier: 'best',
    priceRange: { low: 55, high: 70 },
    coverage: 350,
    finishes: ['semi-gloss', 'gloss'],
    primerBuiltIn: false,
    benefits: [
      'Direct-to-metal — no primer needed on clean metal',
      'Rust inhibitive',
      'Interior/exterior',
      'Great for railings, fences, metal doors',
    ],
    bestFor: 'Metal surfaces, railings, industrial, fences',
  },
  {
    id: 'loxon-concrete',
    name: 'Loxon',
    fullName: 'Loxon Concrete & Masonry Primer/Sealer',
    category: 'specialty',
    tier: 'better',
    priceRange: { low: 45, high: 58 },
    coverage: 200,
    finishes: ['flat'],
    primerBuiltIn: false,
    benefits: [
      'Penetrates and seals concrete/masonry',
      'Efflorescence resistant',
      'Can apply to green (new) concrete',
      'Alkali resistant',
    ],
    bestFor: 'Concrete, stucco, masonry, block walls',
  },
];

// Tier metadata for display
export const TIER_INFO: Record<ProductTier, { label: string; color: string; emoji: string; description: string }> = {
  good: {
    label: 'Good',
    color: '#60a5fa', // blue-400
    emoji: '⭐',
    description: 'Solid performance at an affordable price. Great for rentals, touch-ups, and budget projects.',
  },
  better: {
    label: 'Better',
    color: '#34d399', // emerald-400
    emoji: '⭐⭐',
    description: 'Enhanced features like paint+primer, better coverage, and improved durability.',
  },
  best: {
    label: 'Best',
    color: '#a78bfa', // violet-400
    emoji: '⭐⭐⭐',
    description: 'Top performance with advanced technology. Long-lasting, one-coat coverage, premium finishes.',
  },
  premium: {
    label: 'Premium',
    color: '#fbbf24', // amber-400
    emoji: '👑',
    description: 'The absolute best SW offers. Unmatched durability, coverage, and color retention.',
  },
};

// Category labels
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  interior: 'Interior Paint',
  exterior: 'Exterior Paint',
  primer: 'Primers',
  trim: 'Trim & Enamel',
  specialty: 'Specialty',
};

// Helper: get products by category
export const getProductsByCategory = (category: ProductCategory): SWProduct[] =>
  SW_PRODUCTS.filter(p => p.category === category);

// Helper: get products by tier
export const getProductsByTier = (tier: ProductTier): SWProduct[] =>
  SW_PRODUCTS.filter(p => p.tier === tier);

// Helper: search products
export const searchProducts = (query: string): SWProduct[] => {
  const q = query.toLowerCase();
  return SW_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.fullName.toLowerCase().includes(q) ||
    p.bestFor.toLowerCase().includes(q) ||
    p.benefits.some(b => b.toLowerCase().includes(q))
  );
};
