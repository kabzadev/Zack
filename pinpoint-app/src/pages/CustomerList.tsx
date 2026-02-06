import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore, type CustomerFilters, type CustomerType, type CustomerStatus } from '../stores/customerStore';

const typeConfig: Record<CustomerType, { emoji: string; label: string; gradient: string }> = {
  'homeowner': { emoji: '🏠', label: 'Homeowner', gradient: 'from-blue-500/20 to-cyan-500/20' },
  'contractor': { emoji: '🔨', label: 'Contractor', gradient: 'from-orange-500/20 to-amber-500/20' },
  'property-manager': { emoji: '🏢', label: 'Property Mgr', gradient: 'from-purple-500/20 to-pink-500/20' },
  'commercial': { emoji: '🏬', label: 'Commercial', gradient: 'from-green-500/20 to-emerald-500/20' }
};

const statusConfig: Record<CustomerStatus, { dot: string; label: string }> = {
  'active': { dot: 'bg-green-500', label: 'Active' },
  'inactive': { dot: 'bg-slate-500', label: 'Inactive' },
  'prospect': { dot: 'bg-amber-500', label: 'Prospect' }
};

export const CustomerList = () => {
  const navigate = useNavigate();
  const { customers, tags, searchCustomers } = useCustomerStore();
  
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({
    type: 'all',
    status: 'all',
    tags: []
  });

  const filteredCustomers = useMemo(() => {
    return searchCustomers({ search, ...filters });
  }, [search, filters, customers, searchCustomers]);

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag]
    }));
  };

  const clearFilters = () => {
    setFilters({ type: 'all', status: 'all', tags: [] });
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <header className="app-header px-5 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-white text-xl">Customers</h1>
          </div>
          <span className="text-sm text-slate-400">
            {filteredCustomers.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-12"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center ${
              showFilters 
                ? 'bg-blue-500 text-white shadow-glow' 
                : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 px-5 py-4 space-y-4 animate-fade-in-up">
          {/* Type Filter */}
          <div>
            <label className="section-title mb-3 block">Customer Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.type === 'all'
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                All Types
              </button>
              {(['homeowner', 'contractor', 'property-manager', 'commercial'] as CustomerType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilters(prev => ({ ...prev, type }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    filters.type === type
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span>{typeConfig[type].emoji}</span>
                  <span>{typeConfig[type].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="section-title mb-3 block">Status</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.status === 'all'
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                All Status
              </button>
              {(['active', 'inactive', 'prospect'] as CustomerStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilters(prev => ({ ...prev, status }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    filters.status === status
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusConfig[status].dot}`}></span>
                  <span>{statusConfig[status].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div>
              <label className="section-title mb-3 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      filters.tags?.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          <button 
            onClick={clearFilters}
            className="w-full py-3 text-center text-sm text-slate-400 hover:text-white transition-colors border-t border-slate-800/50 pt-4"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Customer List */}
      <div className="p-5">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            <p className="text-lg font-medium text-white mb-2">No customers found</p>
            <p className="text-sm text-slate-400 mb-6">Try adjusting your search or filters</p>
            <button 
              onClick={clearFilters}
              className="btn-secondary"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer, index) => {
              const type = typeConfig[customer.type];
              const status = statusConfig[customer.status];
              return (
                <div 
                  key={customer.id}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="app-card app-card-hover flex items-center gap-4 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-2xl">{type.emoji}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {customer.firstName} {customer.lastName}
                      </h3>
                      <span className={`w-2 h-2 rounded-full ${status.dot} flex-shrink-0`} />
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="text-slate-500">{type.label}</span>
                      <span className="text-slate-700">•</span>
                      <span className="truncate">{customer.city}</span>
                    </div>

                    {customer.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {customer.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">
                            #{tag}
                          </span>
                        ))}
                        {customer.tags.length > 2 && (
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-500 text-xs rounded-full">
                            +{customer.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-white">{customer.estimateCount}</p>
                    <p className="text-xs text-slate-500">estimates</p>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() => navigate('/customers/new')}
        className="fab fixed bottom-6 right-6 z-50"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};
