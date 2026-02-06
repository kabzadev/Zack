import { useAuthStore } from '../stores/authStore';
import { useCustomerStore } from '../stores/customerStore';
import { LogOut, User, Users, FileText, Plus, Settings, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { getRecentCustomers, customers } = useCustomerStore();
  
  const recentCustomers = getRecentCustomers(3);
  const customerCount = customers.length;
  const activeCustomerCount = customers.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pinpoint-navy rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-bold">◆</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">Pinpoint Painting</h1>
            <p className="text-xs text-gray-500">Professional Estimating</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {/* User Card */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pinpoint-navy rounded-full flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{user?.name || 'Estimator'}</h2>
              <p className="text-sm text-gray-500">{user?.phoneNumber}</p>
            </div>
            <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {user?.role === 'admin' ? 'Admin' : 'Estimator'}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/customers')}
              className="w-full card flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-pinpoint-navy rounded-lg flex items-center justify-center">
                <Plus className="text-white" size={24} />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">New Estimate</p>
                <p className="text-sm text-gray-500">Select a customer first</p>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </button>

            <button 
              onClick={() => navigate('/customers')}
              className="w-full card flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="text-gray-600" size={24} />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Customers</p>
                <p className="text-sm text-gray-500">Manage your customer list</p>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </button>

            <div className="w-full card flex items-center gap-4 opacity-60">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="text-gray-600" size={24} />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Estimates</p>
                <p className="text-sm text-gray-500">Coming soon — view estimate history</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Your Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-pinpoint-navy mb-1">{customerCount}</p>
              <p className="text-sm text-gray-500">Customers</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-green-600 mb-1">{activeCustomerCount}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>

        {/* Recent Customers */}
        {recentCustomers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Recent Customers
            </h3>
            <div className="space-y-3">
              {recentCustomers.map((customer) => (
                <div 
                  key={customer.id}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="card flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {customer.firstName[0]}{customer.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
                    <p className="text-sm text-gray-500">{customer.city}, {customer.state}</p>
                  </div>
                  <ChevronRight className="text-gray-400" size={20} />
                </div>
              ))}
              <button 
                onClick={() => navigate('/customers')}
                className="w-full text-center py-3 text-pinpoint-blue font-medium hover:underline"
              >
                View all customers →
              </button>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        {user?.role === 'admin' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Administration
            </h3>
            <button 
              onClick={() => navigate('/admin')}
              className="w-full card flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="text-gray-600" size={24} />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Admin Panel</p>
                <p className="text-sm text-gray-500">Manage users and settings</p>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};