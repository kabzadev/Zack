import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Types
export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  role: 'admin' | 'estimator';
  status: 'pending' | 'approved' | 'suspended' | 'inactive';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tempPhoneNumber: string | null;
  
  // Actions
  setTempPhoneNumber: (phone: string) => void;
  requestOTP: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phoneNumber: string, code: string) => Promise<{ success: boolean; status?: string; error?: string }>;
  checkAuth: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

// Helpers
const getApiUrl = () => {
  if (window.location.hostname === '100.88.213.43') {
    return 'http://100.88.213.43:3001/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

const isDemoMode = () => {
  return typeof window !== 'undefined' && 
    (localStorage.getItem('demoMode') === 'true' || window.location.search.includes('demo=true'));
};

const API_URL = getApiUrl();

// Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      tempPhoneNumber: null,

      setTempPhoneNumber: (phone: string) => {
        set({ tempPhoneNumber: phone });
      },

      requestOTP: async (phoneNumber: string) => {
        try {
          const response = await axios.post(`${API_URL}/auth/request-otp`, {
            phoneNumber
          });
          
          if (response.data.success) {
            set({ tempPhoneNumber: phoneNumber });
            return { success: true };
          }
          
          return { success: false, error: response.data.error || 'Failed to send code' };
        } catch (error: any) {
          console.error('Request OTP error:', error);
          return { success: false, error: error.response?.data?.error || 'Failed to send code' };
        }
      },

      verifyOTP: async (phoneNumber: string, code: string) => {
        try {
          const response = await axios.post(`${API_URL}/auth/verify-otp`, {
            phoneNumber,
            code,
            deviceName: navigator.userAgent,
            deviceType: /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'mobile' : 'desktop'
          });
          
          const data = response.data;
          
          if (!data.success) {
            return { success: false, error: data.error || 'Verification failed' };
          }
          
          if (data.status === 'pending') {
            set({ 
              user: data.user,
              isAuthenticated: false,
              isLoading: false 
            });
            return { success: true, status: 'pending' };
          }
          
          if (data.tokens) {
            set({
              user: data.user,
              accessToken: data.tokens.accessToken,
              isAuthenticated: true,
              isLoading: false
            });
            
            localStorage.setItem('refreshToken', data.tokens.refreshToken);
          }
          
          return { success: true, status: 'approved' };
        } catch (error: any) {
          console.error('Verify OTP error:', error);
          return { success: false, error: error.response?.data?.error || 'Verification failed' };
        }
      },

      checkAuth: async () => {
        if (isDemoMode()) {
          localStorage.setItem('demoMode', 'true');
          set({
            user: {
              id: 'demo-user',
              phoneNumber: '+1 (440) 555-DEMO',
              name: 'Demo Estimator',
              role: 'admin',
              status: 'approved'
            },
            accessToken: 'demo-token',
            isAuthenticated: true,
            isLoading: false
          });
          return;
        }
        
        const { accessToken } = get();
        
        if (!accessToken) {
          const refreshed = await get().refreshToken();
          if (!refreshed) {
            set({ isLoading: false, isAuthenticated: false });
          }
          return;
        }
        
        try {
          const response = await axios.get(`${API_URL}/auth/status`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (response.data.authenticated) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            const refreshed = await get().refreshToken();
            if (!refreshed) {
              set({ isLoading: false, isAuthenticated: false, user: null });
            }
          }
        } catch (error) {
          const refreshed = await get().refreshToken();
          if (!refreshed) {
            set({ isLoading: false, isAuthenticated: false, user: null });
          }
        }
      },

      refreshToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          return false;
        }
        
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken
          });
          
          if (response.data.tokens) {
            set({ accessToken: response.data.tokens.accessToken });
            localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
            return true;
          }
          
          return false;
        } catch (error) {
          localStorage.removeItem('refreshToken');
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          tempPhoneNumber: null
        });
      }
    }),
    {
      name: 'pinpoint-auth',
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);
