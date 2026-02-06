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
const demoEstimates: Estimate[] = [
  {
    id: 'est-demo-1',
    customerId: 'demo-1',
    customerName: 'Sarah Johnson',
    customerAddress: '1234 Oak Street, Westlake, OH 44145',
    projectName: 'Living Room Refresh',
    description: 'Paint living room and dining area with accent wall',
    scopeOfWork: ['Two coats on walls', 'Accent wall in navy', 'Trim touch-up'],
    materials: [
      { id: 'm1', name: 'SuperPaint Interior - Soft White', quantity: 3, unit: 'gallon', unitPrice: 65, category: 'paint' },
      { id: 'm2', name: 'SuperPaint Interior - Navy Accent', quantity: 1, unit: 'gallon', unitPrice: 65, category: 'paint' },
      { id: 'm3', name: 'Painter\'s Tape', quantity: 4, unit: 'roll', unitPrice: 8, category: 'tape' },
      { id: 'm4', name: 'Patching Compound', quantity: 1, unit: 'gallon', unitPrice: 18, category: 'supply' }
    ],
    labor: [
      { id: 'l1', description: 'Prep and paint living room', painters: 2, days: 1, hoursPerDay: 6, hourlyRate: 45 }
    ],
    materialMarkupPercent: 20,
    taxRate: 8,
    status: 'approved',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-20T14:00:00Z',
    subtotalMaterials: 280,
    subtotalLabor: 540,
    markupAmount: 56,
    taxAmount: 26.88,
    total: 902.88
  },
  {
    id: 'est-demo-2',
    customerId: 'demo-2',
    customerName: 'Michael Chen - Riverview Condos',
    customerAddress: '5000 Riverview Drive, Rocky River, OH 44116',
    projectName: 'Building 7 Exterior Repaint',
    description: 'Full exterior repaint of 12-unit condo building',
    scopeOfWork: ['Pressure wash', 'Scrape and prep', 'Two coats Duration exterior', 'Trim in satin'],
    materials: [
      { id: 'm5', name: 'Duration Exterior - White', quantity: 25, unit: 'gallon', unitPrice: 75, category: 'paint' },
      { id: 'm6', name: 'ProBlock Primer', quantity: 10, unit: 'gallon', unitPrice: 45, category: 'primer' },
      { id: 'm7', name: 'Duration Trim - Black', quantity: 8, unit: 'gallon', unitPrice: 75, category: 'paint' },
      { id: 'm8', name: 'Caulk', quantity: 20, unit: 'each', unitPrice: 6, category: 'caulk' }
    ],
    labor: [
      { id: 'l2', description: 'Exterior prep work', painters: 4, days: 2, hoursPerDay: 8, hourlyRate: 50 },
      { id: 'l3', description: 'Paint application - lower units', painters: 4, days: 3, hoursPerDay: 8, hourlyRate: 50 },
      { id: 'l4', description: 'Paint application - upper units (scaffold)', painters: 3, days: 3, hoursPerDay: 8, hourlyRate: 55 }
    ],
    materialMarkupPercent: 20,
    taxRate: 8,
    status: 'sent',
    createdAt: '2025-01-25T09:00:00Z',
    updatedAt: '2025-01-28T16:00:00Z',
    sentAt: '2025-01-28T16:00:00Z',
    subtotalMaterials: 3090,
    subtotalLabor: 4760,
    markupAmount: 618,
    taxAmount: 296.64,
    total: 8764.64
  },
  {
    id: 'est-demo-3',
    customerId: 'demo-6',
    customerName: 'Jennifer Martinez - South Park Properties',
    customerAddress: '3400 Park Boulevard, Shaker Heights, OH 44122',
    projectName: 'Office Suite Renovation - Units 204-208',
    description: 'Interior repaint of 5 commercial office units',
    scopeOfWork: ['Neutral color scheme throughout', 'Remove old wallpaper in unit 205', 'Paint doors and baseboards'],
    materials: [
      { id: 'm9', name: 'SuperPaint Interior - Dover White', quantity: 8, unit: 'gallon', unitPrice: 65, category: 'paint' },
      { id: 'm10', name: 'SuperPaint Door & Trim - Alabaster', quantity: 4, unit: 'gallon', unitPrice: 70, category: 'paint' },
      { id: 'm11', name: 'Wallpaper remover solution', quantity: 2, unit: 'gallon', unitPrice: 25, category: 'supply' }
    ],
    labor: [
      { id: 'l5', description: 'Prep and wallpaper removal', painters: 2, days: 1, hoursPerDay: 8, hourlyRate: 48 },
      { id: 'l6', description: 'Paint all units', painters: 3, days: 2, hoursPerDay: 8, hourlyRate: 48 }
    ],
    materialMarkupPercent: 20,
    taxRate: 8,
    status: 'draft',
    createdAt: '2025-02-04T10:00:00Z',
    updatedAt: '2025-02-04T17:00:00Z',
    subtotalMaterials: 740,
    subtotalLabor: 1536,
    markupAmount: 148,
    taxAmount: 71.04,
    total: 2495.04
  },
  {
    id: 'est-demo-4',
    customerId: 'demo-5',
    customerName: 'Robert Anderson',
    customerAddress: '456 Maple Drive, Bay Village, OH 44140',
    projectName: 'Hail Damage Exterior Repair',
    description: 'Insurance claim - repaint exterior after storm damage',
    scopeOfWork: ['Insurance scope of work', 'Siding replacement coordination', 'Match existing colors'],
    materials: [
      { id: 'm12', name: 'Duration Exterior - Colonial Yellow', quantity: 12, unit: 'gallon', unitPrice: 75, category: 'paint' },
      { id: 'm13', name: 'Trim Paint - White', quantity: 4, unit: 'gallon', unitPrice: 75, category: 'paint' },
      { id: 'm14', name: 'Primer for bare wood', quantity: 3, unit: 'gallon', unitPrice: 45, category: 'primer' }
    ],
    labor: [
      { id: 'l7', description: 'Exterior prep and painting', painters: 2, days: 3, hoursPerDay: 8, hourlyRate: 52 }
    ],
    materialMarkupPercent: 0,
    taxRate: 8,
    status: 'approved',
    createdAt: '2025-01-05T11:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z',
    subtotalMaterials: 1365,
    subtotalLabor: 2496,
    markupAmount: 0,
    taxAmount: 109.20,
    total: 3970.20
  },
  {
    id: 'est-demo-5',
    customerId: 'demo-3',
    customerName: 'David Rodriguez - BuildRight LLC',
    customerAddress: '892 Industrial Parkway, Cleveland, OH 44109',
    projectName: 'Warehouse Interior Lines',
    description: 'Paint safety lines and staging areas in warehouse',
    scopeOfWork: ['Safety yellow zones', 'White staging areas', 'Directional arrows and markings'],
    materials: [
      { id: 'm15', name: 'Industrial Floor Paint - Safety Yellow', quantity: 8, unit: 'gallon', unitPrice: 85, category: 'paint' },
      { id: 'm16', name: 'Industrial Floor Paint - White', quantity: 10, unit: 'gallon', unitPrice: 85, category: 'paint' },
      { id: 'm17', name: 'Stencil templates', quantity: 1, unit: 'each', unitPrice: 120, category: 'supply' }
    ],
    labor: [
      { id: 'l8', description: 'Clean and prep floor', painters: 2, days: 1, hoursPerDay: 8, hourlyRate: 55 },
      { id: 'l9', description: 'Paint markings and lines', painters: 2, days: 2, hoursPerDay: 8, hourlyRate: 55 }
    ],
    materialMarkupPercent: 15,
    taxRate: 8,
    status: 'sent',
    createdAt: '2025-01-28T10:00:00Z',
    updatedAt: '2025-02-03T10:00:00Z',
    sentAt: '2025-02-03T10:00:00Z',
    subtotalMaterials: 1650,
    subtotalLabor: 2206,
    markupAmount: 247.50,
    taxAmount: 151.80,
    total: 4255.30
  }
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
      partialize: (state) => ({ estimates: state.estimates })
    }
  )
);
