import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { PhoneLogin } from './pages/PhoneLogin';
import { OTPVerify } from './pages/OTPVerify';
import { ApprovalPending } from './pages/ApprovalPending';
import { Dashboard } from './pages/Dashboard';
import { CustomerList } from './pages/CustomerList';
import { CustomerDetail } from './pages/CustomerDetail';
import { NewCustomer } from './pages/NewCustomer';
import { EstimateBuilder } from './pages/EstimateBuilder';
import { ColorPickerPage } from './pages/ColorPickerPage';
import { VoiceEstimate } from './pages/VoiceEstimate';
import { PhotoCapture } from './pages/PhotoCapture';
import { AIVisualization } from './pages/AIVisualization';
import { AdminPanel } from './pages/AdminPanel';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { Settings } from './pages/Settings';
import { EstimateList } from './pages/EstimateList';
import { ProductCatalog } from './pages/ProductCatalog';
import { FloatingAssistant } from './components/FloatingAssistant';
import { useAuthStore } from './stores/authStore';
import { useEffect, useState } from 'react';
import './App.css';

function AppContent() {
  const { checkAuth, isAuthenticated, user, isLoading } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const demoFromUrl = searchParams.has('demo') && searchParams.get('demo') === 'true';
    const demoFromStorage = localStorage.getItem('demoMode') === 'true';
    
    if (demoFromUrl || demoFromStorage) {
      localStorage.setItem('demoMode', 'true');
      setIsDemoMode(true);
      
      const { user: currentUser } = useAuthStore.getState();
      if (!currentUser) {
        useAuthStore.getState().checkAuth();
      }
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const effectiveAuthenticated = isDemoMode || isAuthenticated;
  const effectiveUser = isDemoMode ? { status: 'approved', role: 'admin' } : user;

  if (isLoading && !isDemoMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-[0_10px_40px_rgba(255,255,255,0.15)] mb-6">
            <span className="text-slate-900 text-4xl font-bold animate-pulse">◆</span>
          </div>
          <p className="text-slate-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const fallbackPath = effectiveAuthenticated ? "/" : "/login";

  return (
    <div className="min-h-screen bg-slate-950">
      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 text-sm font-semibold text-center flex items-center justify-center gap-3 shadow-lg">
          <span className="flex items-center gap-2">
            <span className="text-base">🎮</span>
            <span>DEMO MODE</span>
          </span>
          <button 
            onClick={() => {
              localStorage.removeItem('demoMode');
              window.location.href = '/login';
            }}
            className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            Exit Demo
          </button>
        </div>
      )}
      
      <div className={isDemoMode ? 'pt-11' : ''}>
        <Routes>
          <Route 
            path="/login" 
            element={!effectiveAuthenticated ? <PhoneLogin /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/verify" 
            element={!effectiveAuthenticated ? <OTPVerify /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/pending" 
            element={effectiveUser?.status === 'pending' ? <ApprovalPending /> : <Navigate to="/" replace />} 
          />
          
          <Route 
            path="/" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <Dashboard /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/customers" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <CustomerList /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/customers/new" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <NewCustomer /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/customers/:id" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <CustomerDetail /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/colors" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <ColorPickerPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/voice-estimate" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <VoiceEstimate /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/photo-capture" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <PhotoCapture /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/ai-visualization" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <AIVisualization /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/estimates" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <EstimateList /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/estimates/new" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <EstimateBuilder /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/estimates/:id" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <EstimateBuilder /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/admin" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <AdminPanel /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/admin/users" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <AdminUserManagement /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/products" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <ProductCatalog /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/settings" 
            element={effectiveAuthenticated && effectiveUser?.status === 'approved' ? <Settings /> : <Navigate to="/login" replace />} 
          />
          
          <Route path="*" element={<Navigate to={fallbackPath} replace />} />
        </Routes>
      </div>
      
      {/* Floating assistant — always available on authenticated pages */}
      {effectiveAuthenticated && effectiveUser?.status === 'approved' && (
        <FloatingAssistant />
      )}
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
