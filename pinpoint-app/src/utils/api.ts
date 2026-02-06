// Centralized API URL configuration
export const getApiUrl = (): string => {
  // Use VITE_API_URL if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const hostname = window.location.hostname;
  
  // Azure deployment — use the backend Container App
  if (hostname.includes('azurecontainerapps.io') || hostname.includes('politemushroom')) {
    return 'https://pinpoint-backend.politemushroom-118533c3.eastus2.azurecontainerapps.io/api';
  }
  
  // Tailscale local network
  if (hostname === '100.88.213.43') {
    return 'http://100.88.213.43:3001/api';
  }
  
  // Local dev
  return 'http://localhost:3001/api';
};

export const API_URL = getApiUrl();
