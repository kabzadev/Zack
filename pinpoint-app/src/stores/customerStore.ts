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

// Demo data — clean slate with just the owner
const demoCustomers: Customer[] = [
  {
    id: 'demo-keith',
    firstName: 'Keith',
    lastName: 'Kabza',
    email: 'keith@teamsdeveloper.com',
    phone: '(440) 555-0001',
    address: '123 Main Street',
    city: 'Cleveland',
    state: 'OH',
    zipCode: '44101',
    type: 'homeowner',
    status: 'active',
    tags: ['Interior', 'Exterior'],
    estimateCount: 0,
    totalEstimateValue: 0,
    createdAt: '2025-02-06T12:00:00Z',
    updatedAt: '2025-02-06T12:00:00Z'
  },
  {
    id: 'demo-cust-001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@email.com',
    phone: '(440) 555-0123',
    address: '123 Oak Street',
    city: 'Lakewood',
    state: 'OH',
    zipCode: '44107',
    type: 'homeowner',
    status: 'active',
    tags: ['Exterior', 'Referral'],
    estimateCount: 1,
    totalEstimateValue: 6849.22,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2026-02-05T16:30:00Z'
  },
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
      version: 4, // Bump to force reset — fresh demo data with Sarah Johnson
      partialize: (state) => ({ 
        customers: state.customers,
        tags: state.tags 
      }),
      migrate: () => ({
        customers: demoCustomers,
        tags: defaultTags,
      }),
    }
  )
);
