import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCustomerStore } from '../stores/customerStore';

export const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, updateCustomer, deleteCustomer, tags, addTag } = useCustomerStore();
  
  const customer = id ? getCustomer(id) : undefined;
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editedCustomer, setEditedCustomer] = useState(customer);

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Customer not found</p>
          <button
            onClick={() => navigate('/customers')}
            className="btn-primary"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (editedCustomer) {
      updateCustomer(customer.id, editedCustomer);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    deleteCustomer(customer.id);
    navigate('/customers');
  };

  const addCustomerTag = (tag: string) => {
    if (tag && !editedCustomer?.tags.includes(tag)) {
      setEditedCustomer(prev => prev ? {
        ...prev,
        tags: [...prev.tags, tag]
      } : prev);
      if (!tags.includes(tag)) {
        addTag(tag);
      }
    }
  };

  const removeCustomerTag = (tag: string) => {
    setEditedCustomer(prev => prev ? {
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    } : prev);
  };

  const displayCustomer = isEditing ? editedCustomer : customer;

  // Type config
  const typeConfig = {
    'homeowner': { emoji: '🏠', label: 'Homeowner' },
    'contractor': { emoji: '🔨', label: 'Contractor' },
    'property-manager': { emoji: '🏢', label: 'Property Manager' },
    'commercial': { emoji: '🏬', label: 'Commercial' }
  };

  const type = typeConfig[customer.type];

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <header className="app-header px-5 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/customers')}
              className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center text-xl font-medium"
            >
              ‹
            </button>
            <div>
              <h1 className="font-bold text-white text-lg">
                {customer.firstName} {customer.lastName}
              </h1>
              <p className="text-sm text-slate-400">
                {customer.estimateCount} estimates · ${customer.totalEstimateValue.toLocaleString()} total
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all text-lg ${
                isEditing 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isEditing ? '✓' : '✎'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center text-lg"
            >
              🗑
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Type Badge */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{type.emoji}</span>
          <span className="text-slate-300">{type.label}</span>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
            customer.status === 'active' ? 'bg-green-500/20 text-green-400' :
            customer.status === 'prospect' ? 'bg-amber-500/20 text-amber-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
          </span>
        </div>

        {/* Contact Info */}
        <div className="app-card">
          <h2 className="section-title mb-4">Contact Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                📞
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={displayCustomer?.phone}
                  onChange={(e) => setEditedCustomer(prev => prev ? { ...prev, phone: e.target.value } : prev)}
                  className="flex-1 input-field"
                />
              ) : (
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium text-white">{customer.phone}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                ✉️
              </div>
              {isEditing ? (
                <input
                  type="email"
                  value={displayCustomer?.email || ''}
                  onChange={(e) => setEditedCustomer(prev => prev ? { ...prev, email: e.target.value } : prev)}
                  className="flex-1 input-field"
                  placeholder="Email address"
                />
              ) : (
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-white">{customer.email || '—'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="app-card">
          <h2 className="section-title mb-4">Address</h2>
          
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={displayCustomer?.address}
                onChange={(e) => setEditedCustomer(prev => prev ? { ...prev, address: e.target.value } : prev)}
                className="w-full input-field"
                placeholder="Street address"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={displayCustomer?.city}
                  onChange={(e) => setEditedCustomer(prev => prev ? { ...prev, city: e.target.value } : prev)}
                  className="flex-1 input-field"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={displayCustomer?.state}
                  onChange={(e) => setEditedCustomer(prev => prev ? { ...prev, state: e.target.value } : prev)}
                  className="w-20 input-field"
                  placeholder="State"
                />
                <input
                  type="text"
                  value={displayCustomer?.zipCode}
                  onChange={(e) => setEditedCustomer(prev => prev ? { ...prev, zipCode: e.target.value } : prev)}
                  className="w-28 input-field"
                  placeholder="ZIP"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                📍
              </div>
              <div>
                <p className="font-medium text-white">{customer.address}</p>
                <p className="text-slate-400">{customer.city}, {customer.state} {customer.zipCode}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="app-card">
          <h2 className="section-title mb-4">Tags</h2>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {displayCustomer?.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm flex items-center gap-1">
                #{tag}
                {isEditing && (
                  <button
                    onClick={() => removeCustomerTag(tag)}
                    className="text-slate-500 hover:text-red-400 ml-1"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          
          {isEditing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addCustomerTag(newTag);
                    setNewTag('');
                  }
                }}
                className="flex-1 input-field py-2"
                placeholder="Add tag..."
              />
              <button
                onClick={() => {
                  addCustomerTag(newTag);
                  setNewTag('');
                }}
                className="btn-primary py-2 px-4 text-lg"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="app-card">
          <h2 className="section-title mb-4">Notes</h2>
          
          {isEditing ? (
            <textarea
              value={displayCustomer?.notes || ''}
              onChange={(e) => setEditedCustomer(prev => prev ? { ...prev, notes: e.target.value } : prev)}
              className="w-full input-field min-h-[100px]"
              placeholder="Add notes about this customer..."
            />
          ) : (
            <p className="text-slate-400">{customer.notes || 'No notes added.'}</p>
          )}
        </div>

        {/* Estimates */}
        <div className="app-card">
          <h2 className="section-title mb-4">Estimates</h2>
          
          <div className="text-center py-8">
            <div className="text-5xl mb-3">📋</div>
            {customer.estimateCount === 0 ? (
              <p className="text-slate-400 mb-3">No estimates yet</p>
            ) : (
              <p className="text-slate-400 mb-3">{customer.estimateCount} estimates · ${customer.totalEstimateValue.toLocaleString()} total</p>
            )}
            <button
              onClick={() => navigate(`/estimates/new?customer=${customer.id}`)}
              className="btn-primary"
            >
              <span className="mr-2">+</span>
              New Estimate
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="app-card max-w-sm w-full">
            <h2 className="text-xl font-bold text-white mb-2">Delete Customer?</h2>
            <p className="text-slate-400 mb-6">
              This will permanently delete {customer.firstName} {customer.lastName} and all associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
