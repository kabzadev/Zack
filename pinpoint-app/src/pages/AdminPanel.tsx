import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Button, Badge } from '../components';
import { useAuthStore } from '../stores/authStore';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import axios from 'axios';

/* ─── Types ─── */
interface AdminUser {
  id: string;
  phoneNumber: string;
  name?: string;
  role: 'admin' | 'estimator';
  status: 'pending' | 'approved' | 'suspended' | 'inactive';
  lastLogin?: string;
  createdAt?: string;
}

interface AdminStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}

/* ─── Helpers ─── */
const getApiUrl = () => {
  if (window.location.hostname === '100.88.213.43') {
    return 'http://100.88.213.43:3002/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
};

const API = getApiUrl();

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ─── Component ─── */
export const AdminPanel = () => {
  const navigate = useNavigate();
  const { accessToken, user } = useAuthStore();

  const [stats, setStats] = useState<AdminStats>({ total: 0, active: 0, pending: 0, suspended: 0 });
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [activeUsers, setActiveUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${accessToken}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, pendingRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/admin/users/pending`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/users`, { headers }).catch(() => ({ data: [] })),
      ]);

      if (statsRes.data) {
        setStats(statsRes.data);
      }
      setPendingUsers(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      const all: AdminUser[] = Array.isArray(usersRes.data) ? usersRes.data : [];
      setActiveUsers(all.filter((u) => u.status === 'approved'));
    } catch {
      setError('Backend server not connected. User management requires the backend to be deployed. Go to Settings to configure rates and pricing.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/approve`, {}, { headers });
      await fetchData();
    } catch {
      setError('Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (userId: string) => {
    setActionLoading(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/decline`, {}, { headers });
      await fetchData();
    } catch {
      setError('Failed to decline user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/decline`, {}, { headers });
      await fetchData();
    } catch {
      setError('Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  /* Guard: only admins */
  if (user?.role !== 'admin') {
    return (
      <Layout activeTab="settings">
        <div className="flex items-center justify-center min-h-[60vh] px-5">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-6">You need admin privileges to access this page.</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeTab="settings">
      <div className="px-5 pt-6 pb-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">Manage users and approvals</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 transition-all active:scale-95"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-400 text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400/60 text-xs mt-1 underline">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400">Total Users</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <UserCheck size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <UserX size={20} className="text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.suspended}</p>
                <p className="text-xs text-slate-400">Suspended</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              Pending Approvals
            </h2>
            {pendingUsers.length > 0 && (
              <Badge variant="warning" size="sm" dot>
                {pendingUsers.length}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-pulse text-blue-400 text-xl">◆</div>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="py-8 text-center">
              <UserCheck size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{u.name || u.phoneNumber}</p>
                    {u.name && <p className="text-xs text-slate-400 truncate">{u.phoneNumber}</p>}
                    <p className="text-xs text-slate-500 mt-0.5">{timeAgo(u.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => handleApprove(u.id)}
                      disabled={actionLoading === u.id}
                      className="w-9 h-9 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => handleDecline(u.id)}
                      disabled={actionLoading === u.id}
                      className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Users */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
              <UserCheck size={16} className="text-green-400" />
              Active Users
            </h2>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-blue-400 text-xs font-medium flex items-center gap-1 hover:text-blue-300 transition-colors"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-pulse text-blue-400 text-xl">◆</div>
            </div>
          ) : activeUsers.length === 0 ? (
            <div className="py-8 text-center">
              <Users size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No active users yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeUsers.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-blue-400 text-sm font-bold flex-shrink-0">
                      {(u.name || u.phoneNumber).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{u.name || u.phoneNumber}</p>
                      <p className="text-xs text-slate-500">{timeAgo(u.lastLogin)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.role === 'admin' ? 'info' : 'neutral'} size="sm">
                      {u.role}
                    </Badge>
                    <button
                      onClick={() => handleSuspend(u.id)}
                      disabled={actionLoading === u.id}
                      className="w-8 h-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all disabled:opacity-50"
                      title="Suspend user"
                    >
                      <UserX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Manage All Users Link */}
        <Button
          variant="secondary"
          fullWidth
          rightIcon={<ChevronRight size={18} />}
          onClick={() => navigate('/admin/users')}
        >
          Manage All Users
        </Button>
      </div>
    </Layout>
  );
};
