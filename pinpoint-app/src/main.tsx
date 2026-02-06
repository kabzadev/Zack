import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { telemetry } from './utils/telemetry'

// Global error capture
window.addEventListener('error', (e) => {
  telemetry.error('uncaught', { 
    message: e.message, 
    filename: e.filename?.split('/').pop(), 
    line: e.lineno, 
    col: e.colno 
  });
});

window.addEventListener('unhandledrejection', (e) => {
  telemetry.error('unhandled_promise', { 
    reason: String(e.reason)?.slice(0, 200) 
  });
});

// Track app startup
telemetry.nav('app_start', { 
  url: window.location.pathname + window.location.search,
  ua: navigator.userAgent.slice(0, 80),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
