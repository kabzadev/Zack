import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../stores/customerStore';

export const NewCustomer = () => {
  const navigate = useNavigate();
  const { addCustomer, tags, addTag } = useCustomerStore();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'homeowner' as const,
    notes: '',
    selectedTags: [] as string[],
    newTag: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.replace(/\D/g, '').length <= 10) {
      setFormData(prev => ({ ...prev, phone: formatted }));
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  const addNewTag = () => {
    if (formData.newTag && !formData.selectedTags.includes(formData.newTag)) {
      setFormData(prev => ({
        ...prev,
        selectedTags: [...prev.selectedTags, prev.newTag],
        newTag: ''
      }));
      addTag(formData.newTag);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.replace(/\D/g, '').trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const customer = addCustomer({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email || undefined,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      notes: formData.notes || undefined,
      tags: formData.selectedTags,
      type: formData.type,
      status: 'active'
    });
    
    navigate(`/customers/${customer.id}`);
  };

  const typeConfig = {
    'homeowner': { emoji: '🏠', label: 'Homeowner' },
    'contractor': { emoji: '🔨', label: 'Contractor' },
    'property-manager': { emoji: '🏢', label: 'Property Mgr' },
    'commercial': { emoji: '🏬', label: 'Commercial' }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <header className="app-header px-5 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/customers')}
            className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center text-xl font-medium"
          >
            ‹
          </button>
          <h1 className="font-bold text-white text-lg">New Customer</h1>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Name */}
        <div className="app-card space-y-4">
          <h2 className="section-title">Name</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={`w-full input-field ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="First name"
              />
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={`w-full input-field ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="Last name"
              />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="app-card space-y-4">
          <h2 className="section-title">Contact</h2>
          
          <div>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              className={`w-full input-field ${errors.phone ? 'border-red-500' : ''}`}
              placeholder="Phone number"
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>
          
          <div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full input-field"
              placeholder="Email (optional)"
            />
          </div>
        </div>

        {/* Address */}
        <div className="app-card space-y-4">
          <h2 className="section-title">Address</h2>
          
          <div>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className={`w-full input-field ${errors.address ? 'border-red-500' : ''}`}
              placeholder="Street address"
            />
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className={`w-full input-field ${errors.city ? 'border-red-500' : ''}`}
                placeholder="City"
              />
              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className={`w-full input-field ${errors.state ? 'border-red-500' : ''}`}
                placeholder="State"
              />
              {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
            </div>
          </div>
          
          <div>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
              className={`w-full input-field ${errors.zipCode ? 'border-red-500' : ''}`}
              placeholder="ZIP code"
            />
            {errors.zipCode && <p className="text-red-400 text-xs mt-1">{errors.zipCode}</p>}
          </div>
        </div>

        {/* Customer Type */}
        <div className="app-card space-y-4">
          <h2 className="section-title">Customer Type</h2>
          
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                className={`p-3 rounded-xl text-sm font-medium border-2 transition-all text-left flex items-center gap-2 ${
                  formData.type === type
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span>{typeConfig[type].emoji}</span>
                <span>{typeConfig[type].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="app-card space-y-4">
          <h2 className="section-title">Tags</h2>
          
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  formData.selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.newTag}
              onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
              className="flex-1 input-field py-2"
              placeholder="Add custom tag..."
            />
            <button
              type="button"
              onClick={addNewTag}
              className="btn-primary py-2 px-4 text-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="app-card space-y-4">
          <h2 className="section-title">Notes</h2>
          
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full input-field min-h-[100px]"
            placeholder="Add any notes about this customer..."
          />
        </div>

        {/* Submit */}
        <div className="pt-4 pb-8">
          <button type="submit" className="w-full btn-primary py-4 text-lg font-semibold">
            Create Customer
          </button>
        </div>
      </form>
    </div>
  );
};
