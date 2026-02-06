import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: 'gallon' | 'quart' | 'each' | 'case' | 'roll' | 'sqft';
  unitPrice: number;
  category: 'paint' | 'primer' | 'supply' | 'caulk' | 'tape' | 'other';
}

export interface LaborItem {
  id: string;
  description: string;
  painters: number;
  days: number;
  hoursPerDay: number;
  hourlyRate: number;
}

export interface Estimate {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  projectName: string;
  description?: string;
  scopeOfWork: string[];
  materials: MaterialItem[];
  labor: LaborItem[];
  materialMarkupPercent: number;
  taxRate: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  expiresAt?: string;
  subtotalMaterials: number;
  subtotalLabor: number;
  markupAmount: number;
  taxAmount: number;
  total: number;
}

interface EstimateState {
  estimates: Estimate[];
  currentEstimate: Estimate | null;
  
  createEstimate: (customerId: string, customerName: string, customerAddress: string) => Estimate;
  updateEstimate: (id: string, updates: Partial<Estimate>) => void;
  deleteEstimate: (id: string) => void;
  addMaterial: (estimateId: string, material: Omit<MaterialItem, 'id'>) => void;
  updateMaterial: (estimateId: string, materialId: string, updates: Partial<MaterialItem>) => void;
  removeMaterial: (estimateId: string, materialId: string) => void;
  addLabor: (estimateId: string, labor: Omit<LaborItem, 'id'>) => void;
  updateLabor: (estimateId: string, laborId: string, updates: Partial<LaborItem>) => void;
  removeLabor: (estimateId: string, laborId: string) => void;
  setCurrentEstimate: (estimate: Estimate | null) => void;
  getEstimateById: (id: string) => Estimate | undefined;
  getEstimatesByCustomer: (customerId: string) => Estimate[];
  getRecentEstimates: (limit?: number) => Estimate[];
  recalculateTotals: (estimate: Estimate) => Estimate;
  duplicateEstimate: (id: string) => Estimate;
}

// Helpers
const generateId = () => Math.random().toString(36).substring(2, 15);

const isDemoMode = () => {
  return typeof window !== 'undefined' && 
    (localStorage.getItem('demoMode') === 'true' || window.location.search.includes('demo=true'));
};

// Demo data
// Demo data — sample estimate matching PDF template
const demoEstimates: Estimate[] = [
  {
    id: 'demo-est-001',
    customerId: 'demo-cust-001',
    customerName: 'Sarah Johnson',
    customerAddress: '123 Oak Street, Lakewood, OH 44107',
    projectName: 'Exterior Repaint',
    description: 'Complete exterior repaint including front elevation, both side walls, rear wall, and garage. Includes trim work, window frames, front door, and accent details. All surfaces shall receive proper preparation prior to coating application.',
    scopeOfWork: [
      'Patch nail holes and stress cracks',
      'Sand patched areas smooth',
      'Pressure wash exterior surfaces',
      'Scrape loose/peeling paint',
      'Protect landscaping & surfaces',
      'Caulk gaps in trim and seams',
      'Prime bare wood where needed',
      'Daily cleanup and final cleanup',
    ],
    materials: [
      { id: 'mat-1', name: 'SW Duration Home Exterior — Naval (SW 6244), Satin', quantity: 12, unit: 'gallon', unitPrice: 75, category: 'paint' },
      { id: 'mat-2', name: 'SW Pro-Classic Waterborne — Alabaster (SW 7008), Semi-Gloss', quantity: 4, unit: 'gallon', unitPrice: 68, category: 'paint' },
      { id: 'mat-3', name: 'SW Emerald Urethane — Gale Force (SW 7605), Gloss', quantity: 1, unit: 'gallon', unitPrice: 95, category: 'paint' },
      { id: 'mat-4', name: 'SW ProBlock Primer', quantity: 4, unit: 'gallon', unitPrice: 45, category: 'primer' },
      { id: 'mat-5', name: 'Blue Painter\'s Tape', quantity: 12, unit: 'roll', unitPrice: 8, category: 'tape' },
      { id: 'mat-6', name: 'White Caulk', quantity: 8, unit: 'each', unitPrice: 6, category: 'caulk' },
      { id: 'mat-7', name: 'Drop Cloths', quantity: 6, unit: 'each', unitPrice: 12, category: 'supply' },
      { id: 'mat-8', name: 'Patching Compound', quantity: 2, unit: 'gallon', unitPrice: 18, category: 'supply' },
    ],
    labor: [
      { id: 'lab-1', description: 'Exterior Painting — Body & Siding', painters: 3, days: 2, hoursPerDay: 8, hourlyRate: 70 },
      { id: 'lab-2', description: 'Trim, Fascia & Door Detail Work', painters: 2, days: 1.5, hoursPerDay: 8, hourlyRate: 70 },
    ],
    materialMarkupPercent: 20,
    taxRate: 8,
    status: 'sent' as const,
    createdAt: '2026-02-05T14:00:00.000Z',
    updatedAt: '2026-02-05T16:30:00.000Z',
    sentAt: '2026-02-05T16:30:00.000Z',
    subtotalMaterials: 1396,
    subtotalLabor: 5040,
    markupAmount: 279.20,
    taxAmount: 134.02,
    total: 6849.22,
  },
];

const defaultMaterials = [
  { name: 'Sherwin-Williams Duration Exterior', category: 'paint' as const, unit: 'gallon' as const, unitPrice: 75 },
  { name: 'Sherwin-Williams SuperPaint Interior', category: 'paint' as const, unit: 'gallon' as const, unitPrice: 65 },
  { name: 'Sherwin-Williams ProBlock Primer', category: 'primer' as const, unit: 'gallon' as const, unitPrice: 45 },
  { name: 'Blue Painter\'s Tape', category: 'tape' as const, unit: 'roll' as const, unitPrice: 8 },
  { name: 'White Caulk', category: 'caulk' as const, unit: 'each' as const, unitPrice: 6 },
  { name: 'Drop Cloths', category: 'supply' as const, unit: 'each' as const, unitPrice: 12 },
  { name: 'Sandpaper (assorted)', category: 'supply' as const, unit: 'case' as const, unitPrice: 25 },
  { name: 'Patching Compound', category: 'supply' as const, unit: 'gallon' as const, unitPrice: 18 }
];

export const materialPresets = defaultMaterials;

const initialEstimates = isDemoMode() ? demoEstimates : [];

// Store
export const useEstimateStore = create<EstimateState>()(
  persist(
    (set, get) => ({
      estimates: initialEstimates,
      currentEstimate: null,

      createEstimate: (customerId, customerName, customerAddress) => {
        const newEstimate: Estimate = {
          id: generateId(),
          customerId,
          customerName,
          customerAddress,
          projectName: 'Untitled Project',
          scopeOfWork: [],
          materials: [],
          labor: [],
          materialMarkupPercent: 20,
          taxRate: 8,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtotalMaterials: 0,
          subtotalLabor: 0,
          markupAmount: 0,
          taxAmount: 0,
          total: 0
        };
        
        set((state) => ({
          estimates: [newEstimate, ...state.estimates],
          currentEstimate: newEstimate
        }));
        
        return newEstimate;
      },

      updateEstimate: (id, updates) => {
        set((state) => {
          const updatedEstimates = state.estimates.map((e) => {
            if (e.id !== id) return e;
            
            const updated = { ...e, ...updates, updatedAt: new Date().toISOString() };
            
            if (updates.materials || updates.labor || updates.materialMarkupPercent !== undefined || updates.taxRate !== undefined) {
              return get().recalculateTotals(updated);
            }
            return updated;
          });
          
          const updatedCurrent = state.currentEstimate?.id === id 
            ? updatedEstimates.find(e => e.id === id) || null
            : state.currentEstimate;
          
          return { estimates: updatedEstimates, currentEstimate: updatedCurrent };
        });
      },

      deleteEstimate: (id) => {
        set((state) => ({
          estimates: state.estimates.filter((e) => e.id !== id),
          currentEstimate: state.currentEstimate?.id === id ? null : state.currentEstimate
        }));
      },

      addMaterial: (estimateId, material) => {
        const newMaterial: MaterialItem = { ...material, id: generateId() };
        
        set((state) => {
          const updatedEstimates = state.estimates.map((e) => {
            if (e.id !== estimateId) return e;
            const updated = {
              ...e,
              materials: [...e.materials, newMaterial],
              updatedAt: new Date().toISOString()
            };
            return get().recalculateTotals(updated);
          });
          
          const updatedCurrent = state.currentEstimate?.id === estimateId 
            ? updatedEstimates.find(e => e.id === estimateId) || null
            : state.currentEstimate;
          
          return { estimates: updatedEstimates, currentEstimate: updatedCurrent };
        });
      },

      updateMaterial: (estimateId, materialId, updates) => {
        set((state) => {
          const updatedEstimates = state.estimates.map((e) => {
            if (e.id !== estimateId) return e;
            const updated = {
              ...e,
              materials: e.materials.map((m) =>
                m.id === materialId ? { ...m, ...updates } : m
              ),
              updatedAt: new Date().toISOString()
            };
            return get().recalculateTotals(updated);
          });
          
          return { estimates: updatedEstimates };
        });
      },

      removeMaterial: (estimateId, materialId) => {
        set((state) => {
          const updatedEstimates = state.estimates.map((e) => {
            if (e.id !== estimateId) return e;
            const updated = {
              ...e,
              materials: e.materials.filter((m) => m.id !== materialId),
              updatedAt: new Date().toISOString()
            };
            return get().recalculateTotals(updated);
          });
          
          return { estimates: updatedEstimates };
        });
      },

      addLabor: (estimateId, labor) => {
        const newLabor: LaborItem = { ...labor, id: generateId() };
        
        set((state) => {
          const updatedEstimates = state.estimates.map((e) => {
            if (e.id !== estimateId) return e;
            const updated = {
              ...e,
              labor: [...e.labor, newLabor],
              updatedAt: new Date().toISOString()
            };
            return get().recalculateTotals(updated);
          });
          
          return { estimates: updatedEstimates };
        });
      },

      updateLabor: (estimateId, laborId, updates) => {
        set((state) => {
          const updatedEstimates = state.estimates.map((e) => {
            if (e.id !== estimateId) return e;
            const updated = {
              ...e,
              labor: e.labor.map((l) =>
                l.id === laborId ? { ...l, ...updates } : l
              ),
              updatedAt: new Date().toISOString()
            };
            return get().recalculateTotals(updated);
          });
          
          return { estimates: updatedEstimates };
        });
      },

      removeLabor: (estimateId, laborId) => {
        set((state) => {
          const updatedEstimates = state.estimates.map((e) => {
            if (e.id !== estimateId) return e;
            const updated = {
              ...e,
              labor: e.labor.filter((l) => l.id !== laborId),
              updatedAt: new Date().toISOString()
            };
            return get().recalculateTotals(updated);
          });
          
          return { estimates: updatedEstimates };
        });
      },

      setCurrentEstimate: (estimate) => {
        set({ currentEstimate: estimate });
      },

      getEstimateById: (id) => {
        return get().estimates.find((e) => e.id === id);
      },

      getEstimatesByCustomer: (customerId) => {
        return get().estimates
          .filter((e) => e.customerId === customerId)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      getRecentEstimates: (limit = 5) => {
        return get().estimates
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
      },

      recalculateTotals: (estimate) => {
        const subtotalMaterials = estimate.materials.reduce(
          (sum, m) => sum + m.quantity * m.unitPrice,
          0
        );

        const subtotalLabor = estimate.labor.reduce(
          (sum, l) => sum + l.painters * l.days * l.hoursPerDay * l.hourlyRate,
          0
        );

        const markupAmount = subtotalMaterials * (estimate.materialMarkupPercent / 100);
        const materialsWithMarkup = subtotalMaterials + markupAmount;
        const taxAmount = materialsWithMarkup * (estimate.taxRate / 100);
        const total = materialsWithMarkup + taxAmount + subtotalLabor;

        return {
          ...estimate,
          subtotalMaterials,
          subtotalLabor,
          markupAmount,
          taxAmount,
          total
        };
      },

      duplicateEstimate: (id) => {
        const original = get().getEstimateById(id);
        if (!original) throw new Error('Estimate not found');

        const duplicate: Estimate = {
          ...original,
          id: generateId(),
          projectName: `${original.projectName} (Copy)`,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sentAt: undefined,
          expiresAt: undefined
        };

        set((state) => ({
          estimates: [duplicate, ...state.estimates]
        }));

        return duplicate;
      }
    }),
    {
      name: 'pinpoint-estimates',
      version: 4, // Bump to force reset — seed demo estimate
      partialize: (state) => ({ estimates: state.estimates }),
      migrate: () => ({
        estimates: isDemoMode() ? demoEstimates : [],
      }),
    }
  )
);
