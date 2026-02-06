import { useAuthStore } from '../stores/authStore';
import { useCustomerStore } from '../stores/customerStore';
import { useEstimateStore } from '../stores/estimateStore';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { getRecentCustomers, customers } = useCustomerStore();
  const { estimates } = useEstimateStore();
  
  const recentCustomers = getRecentCustomers(5);
  const totalCustomers = customers.length;
  const totalEstimates = estimates.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTotalEstimateValue = () => {
    return estimates.reduce((sum, est) => sum + est.total, 0);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-28">
      {/* Header */}
      <header className="app-header px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-slate-900 text-xl font-bold">◆</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-white text-lg">Pinpoint Painting</h1>
            <p className="text-xs text-slate-400">Professional Estimating</p>
          </div>
          <button
            onClick={logout}
            className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="animate-fade-in-up">
          <h2 className="text-3xl font-bold text-white mb-1">
            Hey {user?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-slate-400">Ready to create some estimates?</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="app-card app-card-hover animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{totalCustomers}</p>
            <p className="text-sm text-slate-400">Customers</p>
          </div>
          
          <div className="app-card app-card-hover animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{totalEstimates}</p>
            <p className="text-sm text-slate-400">Estimates</p>
          </div>
        </div>

        {/* Total Value Card */}
        <div className="app-card app-card-hover animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Estimate Value</p>
              <p className="text-3xl font-bold text-gradient">
                {formatCurrency(getTotalEstimateValue())}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-slate-400">{activeCustomers} active customers</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="section-title mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/customers/new')}
              className="w-full app-card app-card-hover flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-white">New Customer</p>
                <p className="text-sm text-slate-400">Add a customer and create estimate</p>
              </div>
              <svg className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/customers')}
              className="w-full app-card app-card-hover flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-white">View Customers</p>
                <p className="text-sm text-slate-400">Browse and manage customers</p>
              </div>
              <svg className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Recent Customers */}
        {recentCustomers.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Recent Customers</h3>
              <button 
                onClick={() => navigate('/customers')}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                See all →
              </button>
            </div>
            <div className="space-y-3">
              {recentCustomers.map((customer, index) => (
                <div 
                  key={customer.id}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="app-card app-card-hover flex items-center gap-4 cursor-pointer"
                  style={{ animationDelay: `${0.35 + index * 0.05}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <span className="text-lg font-semibold text-white">
                      {customer.firstName[0]}{customer.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-sm text-slate-400">
                      {customer.city}, {customer.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-400">{customer.estimateCount}</p>
                    <p className="text-xs text-slate-500">estimates</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="nav-bar">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 p-2 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </button>
        <button onClick={() => navigate('/customers')} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-medium">Customers</span>
        </button>
        {user?.role === 'admin' && (
          <button onClick={() => navigate('/admin')} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </button>
        )}
      </nav>
    </div>
  );
};
