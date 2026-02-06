import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components';
import { PageHeader } from '../components/PageHeader';
import {
  Search,
  Star,
  Crown,
  ChevronDown,
  ChevronUp,
  Paintbrush,
  Home,
  Sun,
  Layers,
  Wrench,
  Check,
  DollarSign,
  Droplets,
} from 'lucide-react';
import {
  SW_PRODUCTS,
  TIER_INFO,
  CATEGORY_LABELS,
  type SWProduct,
  type ProductCategory,
  type ProductTier,
} from '../data/sherwin-williams-products';

type FilterCategory = 'all' | ProductCategory;

const categoryIcons: Record<ProductCategory, React.ReactNode> = {
  interior: <Home size={14} />,
  exterior: <Sun size={14} />,
  primer: <Layers size={14} />,
  trim: <Paintbrush size={14} />,
  specialty: <Wrench size={14} />,
};

const tierOrder: ProductTier[] = ['premium', 'best', 'better', 'good'];

export const ProductCatalog = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let products = SW_PRODUCTS;
    if (activeCategory !== 'all') {
      products = products.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        p.bestFor.toLowerCase().includes(q) ||
        p.benefits.some(b => b.toLowerCase().includes(q)) ||
        p.category.includes(q) ||
        p.tier.includes(q)
      );
    }
    // Sort by tier (premium first)
    return products.sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));
  }, [activeCategory, searchQuery]);

  const categories: { value: FilterCategory; label: string; icon?: React.ReactNode }[] = [
    { value: 'all', label: 'All' },
    { value: 'interior', label: 'Interior', icon: <Home size={12} /> },
    { value: 'exterior', label: 'Exterior', icon: <Sun size={12} /> },
    { value: 'primer', label: 'Primers', icon: <Layers size={12} /> },
    { value: 'trim', label: 'Trim', icon: <Paintbrush size={12} /> },
    { value: 'specialty', label: 'Specialty', icon: <Wrench size={12} /> },
  ];

  const toggleExpand = (id: string) => {
    setExpandedProduct(prev => prev === id ? null : id);
  };

  const TierBadge = ({ tier }: { tier: ProductTier }) => {
    const info = TIER_INFO[tier];
    return (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
        style={{
          color: info.color,
          borderColor: `${info.color}33`,
          backgroundColor: `${info.color}15`,
        }}
      >
        {tier === 'premium' ? '👑 ' : ''}{info.label}
      </span>
    );
  };

  const PriceTag = ({ product }: { product: SWProduct }) => (
    <div className="text-right">
      <p className="text-lg font-bold text-white">
        ${product.priceRange.low}
        <span className="text-slate-500 text-sm font-normal">–</span>
        ${product.priceRange.high}
      </p>
      <p className="text-[10px] text-slate-600">per gallon</p>
    </div>
  );

  const ProductCard = ({ product, index }: { product: SWProduct; index: number }) => {
    const isExpanded = expandedProduct === product.id;
    const tierInfo = TIER_INFO[product.tier];

    return (
      <div
        className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 overflow-hidden transition-all duration-300 animate-fade-in-up"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        {/* Header — always visible */}
        <button
          onClick={() => toggleExpand(product.id)}
          className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-slate-800/30 transition-colors"
        >
          {/* Tier indicator */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: `${tierInfo.color}15`, border: `1px solid ${tierInfo.color}30` }}
          >
            {product.tier === 'premium' ? (
              <Crown size={18} style={{ color: tierInfo.color }} />
            ) : (
              <Star size={18} style={{ color: tierInfo.color }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white text-base">{product.name}</h3>
              <TierBadge tier={product.tier} />
            </div>
            <p className="text-xs text-slate-400 mb-1.5">{product.fullName}</p>
            <p className="text-xs text-slate-500">{product.bestFor}</p>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <PriceTag product={product} />
            {isExpanded ? (
              <ChevronUp size={16} className="text-slate-500" />
            ) : (
              <ChevronDown size={16} className="text-slate-500" />
            )}
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3 animate-fade-in">
            {/* Quick stats */}
            <div className="flex gap-3">
              <div className="flex-1 p-2.5 rounded-xl bg-slate-800/50 text-center">
                <Droplets size={14} className="mx-auto mb-1 text-blue-400" />
                <p className="text-xs text-slate-400">Coverage</p>
                <p className="text-sm font-semibold text-white">{product.coverage} sq ft/gal</p>
              </div>
              <div className="flex-1 p-2.5 rounded-xl bg-slate-800/50 text-center">
                <DollarSign size={14} className="mx-auto mb-1 text-green-400" />
                <p className="text-xs text-slate-400">Price Range</p>
                <p className="text-sm font-semibold text-white">${product.priceRange.low}–${product.priceRange.high}</p>
              </div>
              <div className="flex-1 p-2.5 rounded-xl bg-slate-800/50 text-center">
                {categoryIcons[product.category]}
                <div className="mb-1" />
                <p className="text-xs text-slate-400">Type</p>
                <p className="text-sm font-semibold text-white">{CATEGORY_LABELS[product.category]}</p>
              </div>
            </div>

            {/* Finishes */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Available Finishes</p>
              <div className="flex flex-wrap gap-1.5">
                {product.finishes.map(f => (
                  <span key={f} className="px-2.5 py-1 rounded-lg bg-slate-800/60 text-xs text-slate-300 border border-slate-700/50 capitalize">
                    {f.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Benefits</p>
              <div className="space-y-1.5">
                {product.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Paint + Primer badge */}
            {product.primerBuiltIn && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Check size={14} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">Paint + Primer in One — saves a coat</span>
              </div>
            )}

            {/* Tier description */}
            <div className="p-3 rounded-xl border" style={{ borderColor: `${tierInfo.color}20`, backgroundColor: `${tierInfo.color}08` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: tierInfo.color }}>
                {tierInfo.emoji} {tierInfo.label} Tier
              </p>
              <p className="text-xs text-slate-400">{tierInfo.description}</p>
            </div>

            {product.notes && (
              <p className="text-xs text-slate-500 italic">{product.notes}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <PageHeader title="SW Products" subtitle="Paint Catalog & Pricing" showBack onBack={() => navigate('/')} />

      <div className="px-5 py-4 pb-32 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search products, features, uses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.value
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tier Legend */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tierOrder.map(tier => {
            const info = TIER_INFO[tier];
            return (
              <div key={tier} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/30 border border-slate-800/50 whitespace-nowrap">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                <span className="text-[10px] text-slate-500">{info.emoji} {info.label}</span>
              </div>
            );
          })}
        </div>

        {/* Count */}
        <p className="text-xs text-slate-600">{filtered.length} products</p>

        {/* Product List */}
        <div className="space-y-3">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">No products match your search.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};
