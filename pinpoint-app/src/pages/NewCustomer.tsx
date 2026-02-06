import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore, type CustomerType } from '../stores/customerStore';
import { Layout, Card, Button, Input } from '../components';

const typeConfig: Record<CustomerType, { emoji: string; label: string }> = {
  homeowner: { emoji: '🏠', label: 'Homeowner' },
  contractor: { emoji: '🔨', label: 'Contractor' },
  'property-manager': { emoji: '🏢', label: 'Property Manager' },
  commercial: { emoji: '🏬', label: 'Commercial' },
};

export const NewCustomer = () => {
  const navigate = useNavigate();
  const { addCustomer, tags, addTag } = useCustomerStore();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'homeowner' as CustomerType,
    notes: '',
    selectedTags: [] as string[],
    newTag: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    if (formatted.replace(/\D/g, '').length <= 10) {
      setForm(p => ({ ...p, phone: formatted }));
    }
  };

  const toggleTag = (tag: string) => {
    setForm(p => ({
      ...p,
      selectedTags: p.selectedTags.includes(tag)
        ? p.selectedTags.filter(t => t !== tag)
        : [...p.selectedTags, tag],
    }));
  };

  const addNewTag = () => {
    const trimmed = form.newTag.trim();
    if (trimmed && !form.selectedTags.includes(trimmed)) {
      setForm(p => ({ ...p, selectedTags: [...p.selectedTags, trimmed], newTag: '' }));
      if (!tags.includes(trimmed)) {
        addTag(trimmed);
      }
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!phoneDigits) e.phone = 'Phone number is required';
    else if (phoneDigits.length !== 10) e.phone = 'Phone number must be 10 digits';
    if (!form.address.trim()) e.address = 'Street address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    if (!form.zipCode.trim()) e.zipCode = 'ZIP code is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const customer = addCustomer({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone,
      email: form.email.trim() || undefined,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zipCode: form.zipCode.trim(),
      notes: form.notes.trim() || undefined,
      tags: form.selectedTags,
      type: form.type,
      status: 'active',
    });

    navigate(`/customers/${customer.id}`);
  };

  return (
    <Layout showBack title="New Customer">
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-8">
        {/* Name */}
        <Card>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Name</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
              placeholder="First name"
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
              placeholder="Last name"
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </div>
        </Card>

        {/* Contact */}
        <Card>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Contact</h3>
          <div className="space-y-3">
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              error={!!errors.phone}
              helperText={errors.phone}
            />
            <Input
              label="Email (optional)"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>
        </Card>

        {/* Address */}
        <Card>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Address</h3>
          <div className="space-y-3">
            <Input
              label="Street Address"
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="123 Main St"
              error={!!errors.address}
              helperText={errors.address}
            />
            <div className="grid grid-cols-[1fr_80px_100px] gap-3">
              <Input
                label="City"
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                placeholder="City"
                error={!!errors.city}
                helperText={errors.city}
              />
              <Input
                label="State"
                value={form.state}
                onChange={e => setForm(p => ({ ...p, state: e.target.value.toUpperCase() }))}
                placeholder="OH"
                maxLength={2}
                error={!!errors.state}
                helperText={errors.state}
              />
              <Input
                label="ZIP"
                value={form.zipCode}
                onChange={e => setForm(p => ({ ...p, zipCode: e.target.value }))}
                placeholder="44145"
                error={!!errors.zipCode}
                helperText={errors.zipCode}
              />
            </div>
          </div>
        </Card>

        {/* Customer Type */}
        <Card>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Customer Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(typeConfig) as CustomerType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(p => ({ ...p, type }))}
                className={`p-4 rounded-xl text-sm font-medium border-2 transition-all text-left flex items-center gap-3 ${
                  form.type === type
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-2xl">{typeConfig[type].emoji}</span>
                <span>{typeConfig[type].label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Tags */}
        <Card>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Tags</h3>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    form.selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={form.newTag}
              onChange={e => setForm(p => ({ ...p, newTag: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addNewTag();
                }
              }}
              placeholder="Add custom tag..."
            />
            <Button size="sm" type="button" onClick={addNewTag}>
              Add
            </Button>
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Notes</h3>
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Add any notes about this customer..."
            className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none min-h-[100px] resize-none"
          />
        </Card>

        {/* Submit */}
        <div className="pt-4">
          <Button type="submit" fullWidth size="lg">
            Create Customer
          </Button>
        </div>
      </form>
    </Layout>
  );
};
