import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore, type CustomerFilters, type CustomerType, type CustomerStatus } from '../stores/customerStore';
import { useEstimateStore } from '../stores/estimateStore';
import { Layout, Card, Badge, SearchBar, EmptyState, PageHeader, Modal } from '../components';
import { Plus, Trash2 } from 'lucide-react';

const typeConfig: Record<CustomerType, { emoji: string; label: string; gradient: string }> = {
  homeowner: { emoji: '🏠', label: 'Homeowner', gradient: 'from-blue-500/20 to-cyan-500/20' },
  contractor: { emoji: '🔨', label: 'Contractor', gradient: 'from-orange-500/20 to-amber-500/20' },
  'property-manager': { emoji: '🏢', label: 'Property Mgr', gradient: 'from-purple-500/20 to-pink-500/20' },
  commercial: { emoji: '🏬', label: 'Commercial', gradient: 'from-green-500/20 to-emerald-500/20' },
};

const statusConfig: Record<CustomerStatus, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'neutral', label: 'Inactive' },
  prospect: { variant: 'warning', label: 'Prospect' },
};

export const CustomerList = () => {
  const navigate = useNavigate();
  const { customers, tags, searchCustomers, deleteCustomer } = useCustomerStore();
  const { getEstimatesByCustomer } = useEstimateStore();

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({ type: 'all', status: 'all', tags: [] });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = useCallback(() => {
    if (deleteTarget) {
      deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteCustomer]);

  const filtered = useMemo(() => searchCustomers({ search, ...filters }), [search, filters, customers, searchCustomers]);

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag) ? prev.tags.filter(t => t !== tag) : [...(prev.tags || []), tag],
    }));
  };

  const clearFilters = () => {
    setFilters({ type: 'all', status: 'all', tags: [] });
    setSearch('');
  };

  return (
    <Layout>
      <PageHeader title="Customers" subtitle={`${filtered.length} total`} />

      {/* Search */}
      <div className="px-5 pb-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search customers..."
          showFilter
          onFilterClick={() => setShowFilters(!showFilters)}
          debounceMs={200}
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 px-5 py-4 space-y-4 animate-fade-in-up">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Type</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilters(p => ({ ...p, type: 'all' }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filters.type === 'all' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                All
              </button>
              {(Object.keys(typeConfig) as CustomerType[]).map(type => (
                <button key={type} onClick={() => setFilters(p => ({ ...p, type }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${filters.type === type ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  <span>{typeConfig[type].emoji}</span>{typeConfig[type].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Status</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilters(p => ({ ...p, status: 'all' }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filters.status === 'all' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                All
              </button>
              {(Object.keys(statusConfig) as CustomerStatus[]).map(s => (
                <button key={s} onClick={() => setFilters(p => ({ ...p, status: s }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filters.status === s ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.tags?.includes(tag) ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={clearFilters} className="w-full py-3 text-center text-sm text-slate-400 hover:text-white transition-colors border-t border-slate-800/50 pt-4">
            Clear all filters
          </button>
        </div>
      )}

      {/* List */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <EmptyState emoji="🔍" title="No customers found" description="Try adjusting your search or filters"
            action={{ label: 'Clear filters', onClick: clearFilters }} />
        ) : (
          <div className="space-y-3">
            {filtered.map((c, i) => {
              const type = typeConfig[c.type];
              const status = statusConfig[c.status];
              return (
                <Card key={c.id} padding="sm" animationDelay={i * 40}>
                  <div className="flex items-center gap-3.5 p-1">
                    <div
                      className={`rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center flex-shrink-0 cursor-pointer`}
                      style={{ width: 52, height: 52 }}
                      onClick={() => navigate(`/customers/${c.id}`)}
                    >
                      <span className="text-2xl">{type.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-white truncate text-sm">{c.firstName} {c.lastName}</h3>
                        <Badge variant={status.variant} size="sm" showDot>{status.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{type.label} · {c.city}</p>
                      {c.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {c.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">#{tag}</span>
                          ))}
                          {c.tags.length > 2 && <span className="px-2 py-0.5 bg-slate-800 text-slate-500 text-xs rounded-full">+{c.tags.length - 2}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                        <p className="text-xl font-bold text-white">{getEstimatesByCustomer(c.id).length}</p>
                        <p className="text-xs text-slate-600">estimates</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: c.id, name: `${c.firstName} ${c.lastName}` }); }}
                        className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                        aria-label="Delete customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/customers/new')}
        className="fixed bottom-24 right-5 z-50 w-14 h-14 bg-white text-slate-900 rounded-full shadow-[0_8px_32px_rgba(255,255,255,0.2)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Delete Customer Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Customer"
        size="sm"
      >
        <p className="text-slate-300 mb-6">
          Are you sure you want to delete <strong className="text-white">{deleteTarget?.name}</strong>? This can't be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-semibold"
          >
            Delete
          </button>
        </div>
      </Modal>
    </Layout>
  );
};
