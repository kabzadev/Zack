import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCustomerStore } from '../stores/customerStore';
import { 
  ChevronLeft, Phone, Mail, MapPin, FileText, 
  Edit2, Trash2, Plus, X
} from 'lucide-react';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Customer not found</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/customers')}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {customer.firstName} {customer.lastName}
              </h1>
              <p className="text-sm text-gray-500">
                {customer.estimateCount} estimates · ${customer.totalEstimateValue.toLocaleString()} total
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`p-2 rounded-lg ${isEditing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} hover:opacity-80`}
            >
              {isEditing ? 'Save' : <Edit2 size={20} />}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:opacity-80"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Contact Info */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Contact Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Phone size={20} className="text-gray-600" />
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
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{customer.phone}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Mail size={20} className="text-gray-600" />
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
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{customer.email || '—'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Address</h2>
          
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
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{customer.address}</p>
                <p className="text-gray-500">{customer.city}, {customer.state} {customer.zipCode}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Tags</h2>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {displayCustomer?.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1">
                {tag}
                {isEditing && (
                  <button
                    onClick={() => removeCustomerTag(tag)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={14} />
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
                className="btn-primary py-2"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Notes</h2>
          
          {isEditing ? (
            <textarea
              value={displayCustomer?.notes || ''}
              onChange={(e) => setEditedCustomer(prev => prev ? { ...prev, notes: e.target.value } : prev)}
              className="w-full input-field min-h-[100px]"
              placeholder="Add notes about this customer..."
            />
          ) : (
            <p className="text-gray-600">{customer.notes || 'No notes added.'}</p>
          )}
        </div>

        {/* Estimates */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Estimates</h2>
          
          <div className="text-center py-8">
            <FileText size={48} className="text-gray-300 mx-auto mb-3" />
            {customer.estimateCount === 0 ? (
              <p className="text-gray-500 mb-3">No estimates yet</p>
            ) : (
              <p className="text-gray-500 mb-3">{customer.estimateCount} estimates · ${customer.totalEstimateValue.toLocaleString()} total</p>
            )}
            <button
              onClick={() => navigate(`/estimates/new?customer=${customer.id}`)}
              className="btn-primary"
            >
              <Plus size={18} className="mr-2" />
              New Estimate
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Customer?</h2>
            <p className="text-gray-500 mb-6">
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
                className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700"
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