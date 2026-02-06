import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { PhoneLogin } from './pages/PhoneLogin';
import { OTPVerify } from './pages/OTPVerify';
import { ApprovalPending } from './pages/ApprovalPending';
import { Dashboard } from './pages/Dashboard';
import { CustomerList } from './pages/CustomerList';
import { CustomerDetail } from './pages/CustomerDetail';
import { NewCustomer } from './pages/NewCustomer';
import { EstimateBuilder } from './pages/EstimateBuilder';
import { useAuthStore } from './stores/authStore';
import { useEffect, useState } from 'react';
import './App.css';

function AppContent() {
  const { checkAuth, isAuthenticated, user, isLoading } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check for demo mode immediately on mount
  useEffect(() => {
    const demoFromUrl = searchParams.has('demo') && searchParams.get('demo') === 'true';
    const demoFromStorage = localStorage.getItem('demoMode') === 'true';
    
    if (demoFromUrl || demoFromStorage) {
      localStorage.setItem('demoMode', 'true');
      setIsDemoMode(true);
      
      // Auto-set auth for demo
      const { user: currentUser } = useAuthStore.getState();
      if (!currentUser) {
        // Only set if not already set
        useAuthStore.getState().checkAuth();
      }
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Demo mode: always authenticated
  const effectiveAuthenticated = isDemoMode || isAuthenticated;
  const effectiveUser = isDemoMode ? { status: 'approved', role: 'admin' } : user;

  if (isLoading && !isDemoMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">◆</div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine redirect path
  const fallbackPath = effectiveAuthenticated ? "/" : "/login";

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/90 text-slate-900 px-4 py-2 text-sm font-medium text-center flex items-center justify-center gap-2">
          <span>🎮 DEMO MODE</span>
          <button 
            onClick={() => {
              localStorage.removeItem('demoMode');
              window.location.href = '/login';
            }}
            className="ml-4 px-2 py-0.5 bg-slate-900/20 rounded text-xs hover:bg-slate-900/30"
          >
            Exit
          </button>
        </div>
      )}
      
      <div className={isDemoMode ? 'pt-10' : ''}>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={!effectiveAuthenticated ? <PhoneLogin /> : <Navigate to="/" />} 
          />
          <Route 
            path="/verify" 
            element={!effectiveAuthenticated ? <OTPVerify /> : <Navigate to="/" />} 
          />
          <Route 
            path="/pending" 
            element={effectiveUser?.status === 'pending' ? <ApprovalPending /> : <Navigate to="/" />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/customers" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <CustomerList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/customers/new" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <NewCustomer /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/customers/:id" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <CustomerDetail /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/estimates/new" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <EstimateBuilder /> : <Navigate to="/login" />} 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to={fallbackPath} replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
