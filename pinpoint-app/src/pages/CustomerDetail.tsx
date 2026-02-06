import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCustomerStore } from '../stores/customerStore';
import { useEstimateStore } from '../stores/estimateStore';
import { Layout, Card, Badge, Button, Modal, Input } from '../components';
import { Phone, Mail, MapPin, Pencil, Check, Trash2, Plus, FileText, Tag as TagIcon } from 'lucide-react';

const typeConfig: Record<string, { emoji: string; label: string }> = {
  homeowner: { emoji: '🏠', label: 'Homeowner' },
  contractor: { emoji: '🔨', label: 'Contractor' },
  'property-manager': { emoji: '🏢', label: 'Property Manager' },
  commercial: { emoji: '🏬', label: 'Commercial' },
};

const statusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    approved: 'success',
    sent: 'info',
    draft: 'neutral',
    rejected: 'error',
    expired: 'warning',
  };
  return map[status] || 'neutral';
};

export const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, updateCustomer, deleteCustomer, tags, addTag } = useCustomerStore();
  const { getEstimatesByCustomer } = useEstimateStore();

  const customer = id ? getCustomer(id) : undefined;
  const customerEstimates = id ? getEstimatesByCustomer(id) : [];

  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [edited, setEdited] = useState(customer);

  if (!customer || !edited) {
    return (
      <Layout showBack title="Customer Not Found">
        <div className="flex items-center justify-center min-h-[60vh] px-5">
          <div className="text-center">
            <p className="text-slate-400 mb-4">Customer not found</p>
            <Button onClick={() => navigate('/customers')}>Back to Customers</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const type = typeConfig[customer.type] || { emoji: '👤', label: 'Customer' };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const handleSave = () => {
    if (edited && id) {
      updateCustomer(id, edited);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (id) {
      deleteCustomer(id);
      navigate('/customers');
    }
  };

  const addCustomerTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !edited.tags.includes(trimmed)) {
      setEdited(p => (p ? { ...p, tags: [...p.tags, trimmed] } : p));
      if (!tags.includes(trimmed)) {
        addTag(trimmed);
      }
    }
  };

  const removeCustomerTag = (tag: string) => {
    setEdited(p => (p ? { ...p, tags: p.tags.filter(t => t !== tag) } : p));
  };

  const display = isEditing ? edited : customer;

  const headerActions = (
    <div className="flex gap-2">
      <button
        onClick={() => (isEditing ? handleSave() : (setEdited(customer), setIsEditing(true)))}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          isEditing
            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        aria-label={isEditing ? 'Save changes' : 'Edit customer'}
      >
        {isEditing ? <Check size={18} /> : <Pencil size={18} />}
      </button>
      <button
        onClick={() => setShowDelete(true)}
        className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all flex items-center justify-center"
        aria-label="Delete customer"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );

  return (
    <Layout showBack title={`${customer.firstName} ${customer.lastName}`} headerActions={headerActions}>
      <div className="px-5 py-4 space-y-4 pb-8">
        {/* Type & Status */}
        <div className="flex items-center gap-3 py-2">
          <span className="text-3xl">{type.emoji}</span>
          <span className="text-slate-300 font-medium text-lg">{type.label}</span>
          <div className="ml-auto">
            <Badge
              variant={
                customer.status === 'active' ? 'success' : customer.status === 'prospect' ? 'warning' : 'neutral'
              }
              dot
            >
              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Contact */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
              <Phone size={16} className="text-slate-400" />
              Contact
            </h3>
          </div>
          <div className="space-y-4">
            {/* Phone */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-slate-400" />
              </div>
              {isEditing ? (
                <Input
                  value={display.phone}
                  onChange={e => setEdited(p => (p ? { ...p, phone: e.target.value } : p))}
                  placeholder="Phone number"
                />
              ) : (
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                  <p className="font-medium text-white">{customer.phone}</p>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-slate-400" />
              </div>
              {isEditing ? (
                <Input
                  value={display.email || ''}
                  onChange={e => setEdited(p => (p ? { ...p, email: e.target.value } : p))}
                  placeholder="Email address"
                  type="email"
                />
              ) : (
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-0.5">Email</p>
                  <p className="font-medium text-white">{customer.email || '—'}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" />
              Address
            </h3>
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={display.address}
                onChange={e => setEdited(p => (p ? { ...p, address: e.target.value } : p))}
                placeholder="Street address"
              />
              <div className="grid grid-cols-[1fr_80px_100px] gap-3">
                <Input
                  value={display.city}
                  onChange={e => setEdited(p => (p ? { ...p, city: e.target.value } : p))}
                  placeholder="City"
                />
                <Input
                  value={display.state}
                  onChange={e => setEdited(p => (p ? { ...p, state: e.target.value } : p))}
                  placeholder="ST"
                />
                <Input
                  value={display.zipCode}
                  onChange={e => setEdited(p => (p ? { ...p, zipCode: e.target.value } : p))}
                  placeholder="ZIP"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white leading-relaxed">{customer.address}</p>
                <p className="text-slate-400 mt-1">
                  {customer.city}, {customer.state} {customer.zipCode}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Tags */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
              <TagIcon size={16} className="text-slate-400" />
              Tags
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {display.tags.length === 0 && !isEditing && (
              <p className="text-slate-500 text-sm">No tags added</p>
            )}
            {display.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-slate-800/60 text-slate-300 rounded-full text-sm flex items-center gap-2"
              >
                #{tag}
                {isEditing && (
                  <button
                    onClick={() => removeCustomerTag(tag)}
                    className="text-slate-500 hover:text-red-400 ml-1 text-base leading-none"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomerTag(newTag);
                    setNewTag('');
                  }
                }}
                placeholder="Add tag..."
              />
              <Button
                size="sm"
                onClick={() => {
                  addCustomerTag(newTag);
                  setNewTag('');
                }}
              >
                Add
              </Button>
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Notes</h3>
          </div>
          {isEditing ? (
            <textarea
              value={display.notes || ''}
              onChange={e => setEdited(p => (p ? { ...p, notes: e.target.value } : p))}
              placeholder="Add notes..."
              className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none min-h-[100px] resize-none"
            />
          ) : (
            <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
              {customer.notes || 'No notes added.'}
            </p>
          )}
        </Card>

        {/* Estimates */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              Estimates ({customerEstimates.length})
            </h3>
            <Button
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => navigate(`/estimates/new?customer=${customer.id}`)}
            >
              New
            </Button>
          </div>
          {customerEstimates.length === 0 ? (
            <div className="text-center py-6">
              <FileText size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-3">No estimates yet</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/estimates/new?customer=${customer.id}`)}
              >
                Create First Estimate
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {customerEstimates.map(est => (
                <div
                  key={est.id}
                  onClick={() => navigate(`/estimates/${est.id}`)}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate mb-1">{est.projectName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(est.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-white text-sm mb-1">{fmt(est.total)}</p>
                    <Badge variant={statusBadgeVariant(est.status)} size="sm">
                      {est.status.charAt(0).toUpperCase() + est.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Customer?"
        description={`This will permanently delete ${customer.firstName} ${customer.lastName} and all associated data.`}
      >
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};
