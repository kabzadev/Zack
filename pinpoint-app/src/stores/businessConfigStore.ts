import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HourlyRate {
  id: string;
  label: string;        // e.g., "Standard", "Premium", "After Hours"
  rate: number;          // dollars per hour
  isDefault: boolean;    // only one can be default
}

export interface OneOffCost {
  id: string;
  label: string;        // e.g., "Pressure Washing", "Wallpaper Removal", "Moving Furniture"
  cost: number;          // flat dollar amount
}

interface BusinessConfigState {
  hourlyRates: HourlyRate[];
  oneOffCosts: OneOffCost[];
  defaultMarkupPercent: number;
  defaultTaxRate: number;
  defaultHoursPerDay: number;

  // Rate methods
  addRate: (label: string, rate: number) => void;
  updateRate: (id: string, updates: Partial<Omit<HourlyRate, 'id'>>) => void;
  removeRate: (id: string) => void;
  setDefaultRate: (id: string) => void;
  getDefaultRate: () => HourlyRate | undefined;

  // One-off cost methods
  addCost: (label: string, cost: number) => void;
  updateCost: (id: string, updates: Partial<Omit<OneOffCost, 'id'>>) => void;
  removeCost: (id: string) => void;

  // Config methods
  setMarkup: (pct: number) => void;
  setTaxRate: (pct: number) => void;
  setHoursPerDay: (hours: number) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const defaultRates: HourlyRate[] = [
  { id: 'rate-standard', label: 'Standard', rate: 65, isDefault: true },
  { id: 'rate-premium', label: 'Premium / Detail Work', rate: 85, isDefault: false },
  { id: 'rate-after-hours', label: 'After Hours / Weekend', rate: 95, isDefault: false },
];

const defaultCosts: OneOffCost[] = [
  { id: 'cost-pressure-wash', label: 'Pressure Washing', cost: 250 },
  { id: 'cost-wallpaper', label: 'Wallpaper Removal (per room)', cost: 350 },
  { id: 'cost-furniture', label: 'Moving / Protecting Furniture', cost: 150 },
  { id: 'cost-drywall', label: 'Drywall Repair (minor)', cost: 200 },
  { id: 'cost-wood-rot', label: 'Wood Rot Repair', cost: 400 },
];

export const useBusinessConfigStore = create<BusinessConfigState>()(
  persist(
    (set, get) => ({
      hourlyRates: defaultRates,
      oneOffCosts: defaultCosts,
      defaultMarkupPercent: 20,
      defaultTaxRate: 8,
      defaultHoursPerDay: 8,

      addRate: (label, rate) => {
        set(state => ({
          hourlyRates: [...state.hourlyRates, {
            id: `rate-${generateId()}`,
            label,
            rate,
            isDefault: state.hourlyRates.length === 0,
          }],
        }));
      },

      updateRate: (id, updates) => {
        set(state => ({
          hourlyRates: state.hourlyRates.map(r =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      removeRate: (id) => {
        set(state => {
          const filtered = state.hourlyRates.filter(r => r.id !== id);
          // If we removed the default, make the first one default
          if (filtered.length > 0 && !filtered.some(r => r.isDefault)) {
            filtered[0].isDefault = true;
          }
          return { hourlyRates: filtered };
        });
      },

      setDefaultRate: (id) => {
        set(state => ({
          hourlyRates: state.hourlyRates.map(r => ({
            ...r,
            isDefault: r.id === id,
          })),
        }));
      },

      getDefaultRate: () => {
        return get().hourlyRates.find(r => r.isDefault) || get().hourlyRates[0];
      },

      addCost: (label, cost) => {
        set(state => ({
          oneOffCosts: [...state.oneOffCosts, {
            id: `cost-${generateId()}`,
            label,
            cost,
          }],
        }));
      },

      updateCost: (id, updates) => {
        set(state => ({
          oneOffCosts: state.oneOffCosts.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      removeCost: (id) => {
        set(state => ({
          oneOffCosts: state.oneOffCosts.filter(c => c.id !== id),
        }));
      },

      setMarkup: (pct) => set({ defaultMarkupPercent: pct }),
      setTaxRate: (pct) => set({ defaultTaxRate: pct }),
      setHoursPerDay: (hours) => set({ defaultHoursPerDay: hours }),
    }),
    {
      name: 'pinpoint-business-config',
      version: 1,
    }
  )
);
