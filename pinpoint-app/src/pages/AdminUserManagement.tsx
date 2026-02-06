import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Button, Badge, SearchBar } from '../components';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  Activity,
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
  loginCount?: number;
  estimatesCreated?: number;
}

import { API_URL as API } from '../utils/api';

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

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
    approved: { variant: 'success', label: 'Active' },
    pending: { variant: 'warning', label: 'Pending' },
    suspended: { variant: 'error', label: 'Suspended' },
    inactive: { variant: 'neutral', label: 'Inactive' },
  };
  return map[status] || { variant: 'neutral' as const, label: status };
};

/* ─── Component ─── */
export const AdminUserManagement = () => {
  const navigate = useNavigate();
  const { accessToken, user } = useAuthStore();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${accessToken}` };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/admin/users`, { headers });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load users. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* Actions */
  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/approve`, {}, { headers });
      await fetchUsers();
    } catch {
      setError('Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/decline`, {}, { headers });
      await fetchUsers();
    } catch {
      setError('Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'estimator') => {
    setActionLoading(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/approve`, { role: newRole }, { headers });
      await fetchUsers();
    } catch {
      setError('Failed to update role');
    } finally {
      setActionLoading(null);
      setRoleChangeUser(null);
    }
  };

  /* Filtering */
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.phoneNumber.includes(search);
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  /* Guard */
  if (user?.role !== 'admin') {
    return (
      <Layout activeTab="settings">
        <div className="flex items-center justify-center min-h-[60vh] px-5">
          <div className="text-center">
            <AlertTriangle size={32} className="text-red-400 mx-auto mb-4" />
            <p className="text-white font-bold">Access Denied</p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeTab="settings">
      <div className="px-5 pt-6 pb-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-blue-400" />
              User Management
            </h1>
            <p className="text-slate-400 text-xs">{users.length} total users</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400/60 text-xs underline">
              ×
            </button>
          </div>
        )}

        {/* Search & Filter */}
        <SearchBar placeholder="Search users..." value={search} onChange={setSearch} />

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {['all', 'approved', 'pending', 'suspended'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95
                ${
                  filterStatus === s
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:border-slate-600'
                }
              `}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* User List */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-pulse text-blue-400 text-2xl">◆</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 text-sm">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const badge = statusBadge(u.status);
              const isExpanded = expandedUser === u.id;
              const isRoleEditing = roleChangeUser === u.id;

              return (
                <Card key={u.id} className="bg-slate-800/40 !p-0 overflow-hidden">
                  {/* User Row */}
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-blue-400 text-sm font-bold flex-shrink-0">
                      {(u.name || u.phoneNumber).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">
                        {u.name || 'Unnamed User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{u.phoneNumber}</p>
                    </div>
                    <Badge variant={badge.variant} size="sm">
                      {badge.label}
                    </Badge>
                    <ChevronDown
                      size={16}
                      className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-700/30 pt-3 space-y-3">
                      {/* Activity */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-slate-500">Role</p>
                          <p className="text-sm font-medium text-white capitalize">{u.role}</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-slate-500">Logins</p>
                          <p className="text-sm font-medium text-white">{u.loginCount ?? '—'}</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-slate-500">Estimates</p>
                          <p className="text-sm font-medium text-white">{u.estimatesCreated ?? '—'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Activity size={12} />
                        Last login: {timeAgo(u.lastLogin)}
                      </div>

                      {/* Role Change */}
                      {isRoleEditing ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={u.role === 'admin' ? 'primary' : 'secondary'}
                            onClick={() => handleRoleChange(u.id, 'admin')}
                            disabled={actionLoading === u.id}
                          >
                            Admin
                          </Button>
                          <Button
                            size="sm"
                            variant={u.role === 'estimator' ? 'primary' : 'secondary'}
                            onClick={() => handleRoleChange(u.id, 'estimator')}
                            disabled={actionLoading === u.id}
                          >
                            Estimator
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRoleChangeUser(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Shield size={14} />}
                            onClick={() => setRoleChangeUser(u.id)}
                          >
                            Change Role
                          </Button>

                          {u.status === 'approved' ? (
                            <Button
                              size="sm"
                              variant="danger"
                              icon={<UserX size={14} />}
                              onClick={() => handleSuspend(u.id)}
                              loading={actionLoading === u.id}
                            >
                              Suspend
                            </Button>
                          ) : u.status === 'suspended' ? (
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<UserCheck size={14} />}
                              onClick={() => handleApprove(u.id)}
                              loading={actionLoading === u.id}
                            >
                              Reactivate
                            </Button>
                          ) : u.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<UserCheck size={14} />}
                                onClick={() => handleApprove(u.id)}
                                loading={actionLoading === u.id}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                icon={<UserX size={14} />}
                                onClick={() => handleSuspend(u.id)}
                                loading={actionLoading === u.id}
                              >
                                Decline
                              </Button>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};
