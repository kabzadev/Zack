import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PhoneLogin } from './pages/PhoneLogin';
import { OTPVerify } from './pages/OTPVerify';
import { ApprovalPending } from './pages/ApprovalPending';
import { Dashboard } from './pages/Dashboard';
import { CustomerList } from './pages/CustomerList';
import { CustomerDetail } from './pages/CustomerDetail';
import { NewCustomer } from './pages/NewCustomer';
import { EstimateBuilder } from './pages/EstimateBuilder';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';
import './App.css';

function App() {
  const { checkAuth, isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pinpoint-navy"></div>
      </div>
    );
  }

  // Determine redirect path
  const fallbackPath = isAuthenticated ? "/" : "/login";

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <PhoneLogin /> : <Navigate to="/" />} 
          />
          <Route 
            path="/verify" 
            element={!isAuthenticated ? <OTPVerify /> : <Navigate to="/" />} 
          />
          <Route 
            path="/pending" 
            element={user?.status === 'pending' ? <ApprovalPending /> : <Navigate to="/" />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={isAuthenticated && user?.status === 'approved' ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/customers" 
            element={isAuthenticated && user?.status === 'approved' ? <CustomerList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/customers/new" 
            element={isAuthenticated && user?.status === 'approved' ? <NewCustomer /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/customers/:id" 
            element={isAuthenticated && user?.status === 'approved' ? <CustomerDetail /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/estimates/new" 
            element={isAuthenticated && user?.status === 'approved' ? <EstimateBuilder /> : <Navigate to="/login" />} 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to={fallbackPath} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;