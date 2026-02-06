import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore, CustomerFilters, CustomerType, CustomerStatus } from '../stores/customerStore';
import { 
  Search, Plus, Filter, ChevronLeft, Phone, Mail, MapPin, 
  Tag, MoreVertical, User, Building, Home, Briefcase 
} from 'lucide-react';

const typeColors: Record<CustomerType, { bg: string; text: string; icon: React.ReactNode }> = {
  'homeowner': { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Home size={14} /> },
  'contractor': { bg: 'bg-purple-100', text: 'text-purple-700', icon: <Briefcase size={14} /> },
  'property-manager': { bg: 'bg-green-100', text: 'text-green-700', icon: <Building size={14} /> },
  'commercial': { bg: 'bg-orange-100', text: 'text-orange-700', icon: <Building size={14} /> }
};

const statusColors: Record<CustomerStatus, string> = {
  'active': 'bg-green-500',
  'inactive': 'bg-gray-400',
  'prospect': 'bg-amber-500'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Customers</h1>
          <span className="ml-auto text-sm text-gray-500">
            {filteredCustomers.length} total
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-pinpoint-blue outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl transition-colors ${showFilters ? 'bg-pinpoint-navy text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 py-4 space-y-4">
          {/* Type Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Customer Type</label>
            <div className="flex flex-wrap gap-2">
              {['all', 'homeowner', 'contractor', 'property-manager', 'commercial'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilters(prev => ({ ...prev, type: type as any }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.type === type
                      ? 'bg-pinpoint-navy text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'All Types' : type.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.tags?.includes(tag)
                      ? 'bg-pinpoint-blue text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer List */}
      <div className="p-4">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-500 mb-2">No customers found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => {
              const typeStyle = typeColors[customer.type];
              return (
                <div 
                  key={customer.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        <span className={`w-2 h-2 rounded-full ${statusColors[customer.status]}`} />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${typeStyle.bg} ${typeStyle.text}`}>
                          {typeStyle.icon}
                          {customer.type.replace('-', ' ')}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm">
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={14} className="text-gray-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{customer.city}, {customer.state}</span>
                        </div>
                      </div>

                      {customer.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {customer.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                          {customer.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                              +{customer.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-pinpoint-navy">
                        {customer.estimateCount}
                      </div>
                      <div className="text-xs text-gray-500">estimates</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() => navigate('/customers/new')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-pinpoint-navy text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};