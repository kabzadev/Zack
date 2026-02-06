import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCustomerStore } from '../stores/customerStore';
import { useEstimateStore } from '../stores/estimateStore';
import { Layout, Card, StatCard, Badge } from '../components';
import { Users, FileText, DollarSign, UserCheck, Plus, Mic, Camera, ChevronRight, LogOut, ShoppingBag, Palette } from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { customers } = useCustomerStore();
  const { estimates, getRecentEstimates, getEstimatesByCustomer } = useEstimateStore();

  const recentEstimates = getRecentEstimates(5);
  const recentCustomers = customers
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const totalValue = estimates.reduce((sum, est) => sum + est.total, 0);
  const activeCustomers = customers.filter(c => c.status === 'active').length;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'info' | 'neutral' | 'error'> = {
      approved: 'success', sent: 'info', draft: 'neutral', rejected: 'error', expired: 'warning',
    };
    return <Badge variant={map[status] || 'neutral'} size="sm">{status}</Badge>;
  };

  const typeEmoji: Record<string, string> = {
    homeowner: '🏠', contractor: '🔨', 'property-manager': '🏢', commercial: '🏬',
  };

  return (
    <Layout>
      {/* Header */}
      <header className="app-header px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
            <span className="text-slate-900 text-2xl font-bold">◆</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-white text-lg tracking-tight">Pinpoint Painting</h1>
            <p className="text-xs text-slate-500 font-medium">Professional Estimating</p>
          </div>
          <button
            onClick={logout}
            className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-500 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Welcome */}
        <div className="animate-fade-in-up">
          <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">
            Hey {user?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-slate-400">Ready to create some estimates?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Users size={22} />} iconBg="bg-blue-500/20" iconColor="text-blue-400" value={customers.length} label="Customers" animationDelay={50} />
          <StatCard icon={<FileText size={22} />} iconBg="bg-green-500/20" iconColor="text-green-400" value={estimates.length} label="Estimates" animationDelay={100} />
          <StatCard icon={<DollarSign size={22} />} iconBg="bg-purple-500/20" iconColor="text-purple-400" value={fmt(totalValue)} label="Total Value" animationDelay={150} />
          <StatCard icon={<UserCheck size={22} />} iconBg="bg-amber-500/20" iconColor="text-amber-400" value={activeCustomers} label="Active" animationDelay={200} />
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="space-y-3">
            <Card variant="clickable" onClick={() => navigate('/voice-estimate')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Mic size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Voice Estimate</p>
                  <p className="text-sm text-slate-400">Talk to Damon, our AI assistant</p>
                </div>
                <ChevronRight size={20} className="text-slate-600" />
              </div>
            </Card>

            <Card variant="clickable" onClick={() => navigate('/photo-capture')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Camera size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Color Visualizer</p>
                  <p className="text-sm text-slate-400">See colors on your project</p>
                </div>
                <ChevronRight size={20} className="text-slate-600" />
              </div>
            </Card>

            <Card variant="clickable" onClick={() => navigate('/products')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <ShoppingBag size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">SW Products</p>
                  <p className="text-sm text-slate-400">Paint catalog, tiers & pricing</p>
                </div>
                <ChevronRight size={20} className="text-slate-600" />
              </div>
            </Card>

            <Card variant="clickable" onClick={() => navigate('/colors')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Palette size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">SW Color Wheel</p>
                  <p className="text-sm text-slate-400">Browse 1,500+ Sherwin-Williams colors</p>
                </div>
                <ChevronRight size={20} className="text-slate-600" />
              </div>
            </Card>

            <Card variant="clickable" onClick={() => navigate('/customers/new')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-lg shadow-white/10">
                  <Plus size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">New Customer</p>
                  <p className="text-sm text-slate-400">Add to your database</p>
                </div>
                <ChevronRight size={20} className="text-slate-600" />
              </div>
            </Card>

            <Card variant="clickable" onClick={() => navigate('/customers')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
                  <Users size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">View Customers</p>
                  <p className="text-sm text-slate-400">Browse & manage</p>
                </div>
                <ChevronRight size={20} className="text-slate-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Estimates */}
        {recentEstimates.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Estimates</p>
              <button onClick={() => navigate('/estimates')} className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                See all →
              </button>
            </div>
            <div className="space-y-2">
              {recentEstimates.map((est, i) => (
                <Card key={est.id} variant="clickable" padding="sm" onClick={() => navigate(`/estimates/new?customer=${est.customerId}`)}
                  animationDelay={300 + i * 40}>
                  <div className="flex items-center gap-3 p-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{est.projectName}</p>
                      <p className="text-xs text-slate-500 truncate">{est.customerName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-white text-sm">{fmt(est.total)}</p>
                      {statusBadge(est.status)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Customers */}
        {recentCustomers.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Customers</p>
              <button onClick={() => navigate('/customers')} className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                See all →
              </button>
            </div>
            <div className="space-y-2">
              {recentCustomers.map((c, i) => (
                <Card key={c.id} variant="clickable" padding="sm" onClick={() => navigate(`/customers/${c.id}`)}
                  animationDelay={350 + i * 40}>
                  <div className="flex items-center gap-3 p-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-lg flex-shrink-0">
                      {typeEmoji[c.type] || '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-slate-500">{c.city}, {c.state}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-slate-400">{getEstimatesByCustomer(c.id).length}</p>
                      <p className="text-xs text-slate-600">estimates</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
