import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type CustomerType = 'homeowner' | 'contractor' | 'property-manager' | 'commercial';
export type CustomerStatus = 'active' | 'inactive' | 'prospect';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
  tags: string[];
  type: CustomerType;
  status: CustomerStatus;
  lastContactDate?: string;
  estimateCount: number;
  totalEstimateValue: number;
  createdAt: string;
  updatedAt: string;
  preferredCommunication?: 'phone' | 'email' | 'text';
  referralSource?: string;
}

export interface CustomerFilters {
  search?: string;
  type?: CustomerType | 'all';
  status?: CustomerStatus | 'all';
  tags?: string[];
}

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  tags: string[];
  isLoading: boolean;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'estimateCount' | 'totalEstimateValue'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  selectCustomer: (customer: Customer | null) => void;
  getCustomer: (id: string) => Customer | undefined;
  searchCustomers: (filters: CustomerFilters) => Customer[];
  getRecentCustomers: (limit?: number) => Customer[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  incrementEstimateCount: (customerId: string, value: number) => void;
}

// Helpers
const generateId = () => Math.random().toString(36).substring(2, 15);

const isDemoMode = () => {
  return typeof window !== 'undefined' && 
    (localStorage.getItem('demoMode') === 'true' || window.location.search.includes('demo=true'));
};

// Demo data
const demoCustomers: Customer[] = [
  {
    id: 'demo-1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@email.com',
    phone: '(440) 555-0101',
    address: '1234 Oak Street',
    city: 'Westlake',
    state: 'OH',
    zipCode: '44145',
    type: 'homeowner',
    status: 'active',
    tags: ['Interior', 'Repeat Customer'],
    estimateCount: 3,
    totalEstimateValue: 12500,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-02-01T14:30:00Z'
  },
  {
    id: 'demo-2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'mchen@riverview.com',
    phone: '(440) 555-0102',
    address: '5000 Riverview Drive',
    city: 'Rocky River',
    state: 'OH',
    zipCode: '44116',
    notes: 'Property manager for 12 buildings',
    type: 'property-manager',
    status: 'active',
    tags: ['Commercial', 'Exterior', 'HOA Project'],
    estimateCount: 8,
    totalEstimateValue: 45000,
    createdAt: '2024-11-20T09:00:00Z',
    updatedAt: '2025-01-28T16:00:00Z'
  },
  {
    id: 'demo-3',
    firstName: 'David',
    lastName: 'Rodriguez',
    email: 'dave.r@buildright.com',
    phone: '(440) 555-0103',
    address: '892 Industrial Parkway',
    city: 'Cleveland',
    state: 'OH',
    zipCode: '44109',
    type: 'contractor',
    status: 'active',
    tags: ['Commercial', 'Referral'],
    estimateCount: 5,
    totalEstimateValue: 28000,
    createdAt: '2024-12-05T11:00:00Z',
    updatedAt: '2025-02-03T10:00:00Z'
  },
  {
    id: 'demo-4',
    firstName: 'Emma',
    lastName: 'Williams',
    email: 'emma.w@lakewoodliving.com',
    phone: '(440) 555-0104',
    address: '2000 Lake Avenue',
    city: 'Lakewood',
    state: 'OH',
    zipCode: '44107',
    type: 'commercial',
    status: 'prospect',
    tags: ['Interior', 'Custom Colors'],
    estimateCount: 1,
    totalEstimateValue: 8500,
    createdAt: '2025-01-20T13:00:00Z',
    updatedAt: '2025-02-05T09:30:00Z'
  },
  {
    id: 'demo-5',
    firstName: 'Robert',
    lastName: 'Anderson',
    email: 'bob.anderson@email.com',
    phone: '(440) 555-0105',
    address: '456 Maple Drive',
    city: 'Bay Village',
    state: 'OH',
    zipCode: '44140',
    notes: 'Exterior repaint needed due to hail damage - insurance claim',
    type: 'homeowner',
    status: 'active',
    tags: ['Exterior', 'Insurance Claim'],
    estimateCount: 2,
    totalEstimateValue: 6800,
    createdAt: '2024-10-10T15:00:00Z',
    updatedAt: '2025-01-15T11:00:00Z'
  },
  {
    id: 'demo-6',
    firstName: 'Jennifer',
    lastName: 'Martinez',
    email: 'jennifer.m@southpark.com',
    phone: '(440) 555-0106',
    address: '3400 Park Boulevard',
    city: 'Shaker Heights',
    state: 'OH',
    zipCode: '44122',
    type: 'property-manager',
    status: 'active',
    tags: ['Interior', 'Commercial', 'VIP'],
    estimateCount: 12,
    totalEstimateValue: 72000,
    createdAt: '2024-08-15T08:00:00Z',
    updatedAt: '2025-02-04T17:00:00Z'
  },
  {
    id: 'demo-7',
    firstName: 'Thomas',
    lastName: 'Wilson',
    email: 'tom.w@construction.com',
    phone: '(440) 555-0107',
    address: '1200 Builder Way',
    city: 'Parma',
    state: 'OH',
    zipCode: '44129',
    type: 'contractor',
    status: 'inactive',
    tags: ['Residential', 'Referral'],
    estimateCount: 1,
    totalEstimateValue: 3200,
    createdAt: '2024-09-20T10:00:00Z',
    updatedAt: '2024-11-30T09:00:00Z'
  },
  {
    id: 'demo-8',
    firstName: 'Amanda',
    lastName: 'Davis',
    email: 'amanda.d@email.com',
    phone: '(440) 555-0108',
    address: '789 Sunset Lane',
    city: 'Avon Lake',
    state: 'OH',
    zipCode: '44012',
    type: 'homeowner',
    status: 'prospect',
    tags: ['Interior', 'Exterior'],
    estimateCount: 0,
    totalEstimateValue: 0,
    createdAt: '2025-02-01T16:00:00Z',
    updatedAt: '2025-02-05T14:00:00Z'
  }
];

const defaultTags = [
  'Interior',
  'Exterior',
  'Commercial',
  'Residential',
  'Repeat Customer',
  'VIP',
  'Referral',
  'Insurance Claim',
  'HOA Project',
  'Custom Colors'
];

const initialCustomers = isDemoMode() ? demoCustomers : [];

// Store
export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: initialCustomers,
      selectedCustomer: null,
      tags: defaultTags,
      isLoading: false,

      addCustomer: (customerData) => {
        const newCustomer: Customer = {
          ...customerData,
          id: generateId(),
          estimateCount: 0,
          totalEstimateValue: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        set((state) => ({
          customers: [newCustomer, ...state.customers]
        }));
        
        return newCustomer;
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          )
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
          selectedCustomer: state.selectedCustomer?.id === id ? null : state.selectedCustomer
        }));
      },

      selectCustomer: (customer) => {
        set({ selectedCustomer: customer });
      },

      getCustomer: (id) => {
        return get().customers.find((c) => c.id === id);
      },

      searchCustomers: (filters) => {
        let results = get().customers;
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          results = results.filter((c) =>
            c.firstName.toLowerCase().includes(searchLower) ||
            c.lastName.toLowerCase().includes(searchLower) ||
            c.email?.toLowerCase().includes(searchLower) ||
            c.phone.includes(searchLower) ||
            c.address.toLowerCase().includes(searchLower) ||
            c.tags.some((tag) => tag.toLowerCase().includes(searchLower))
          );
        }
        
        if (filters.type && filters.type !== 'all') {
          results = results.filter((c) => c.type === filters.type);
        }
        
        if (filters.status && filters.status !== 'all') {
          results = results.filter((c) => c.status === filters.status);
        }
        
        if (filters.tags && filters.tags.length > 0) {
          results = results.filter((c) =>
            filters.tags!.some((tag) => c.tags.includes(tag))
          );
        }
        
        return results.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      },

      getRecentCustomers: (limit = 5) => {
        return get().customers
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
      },

      addTag: (tag) => {
        set((state) => ({
          tags: state.tags.includes(tag) ? state.tags : [...state.tags, tag]
        }));
      },

      removeTag: (tag) => {
        set((state) => ({
          tags: state.tags.filter((t) => t !== tag),
          customers: state.customers.map((c) => ({
            ...c,
            tags: c.tags.filter((t) => t !== tag)
          }))
        }));
      },

      incrementEstimateCount: (customerId, value) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  estimateCount: c.estimateCount + 1,
                  totalEstimateValue: c.totalEstimateValue + value,
                  lastContactDate: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              : c
          )
        }));
      }
    }),
    {
      name: 'pinpoint-customers',
      partialize: (state) => ({ 
        customers: state.customers,
        tags: state.tags 
      })
    }
  )
);
