import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEstimateStore, type MaterialItem, type LaborItem, materialPresets } from '../stores/estimateStore';
import { useCustomerStore } from '../stores/customerStore';
import { ChevronLeft, Plus, Save, FileText } from 'lucide-react';

export const EstimateBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customer');
  
  const { createEstimate, updateEstimate, currentEstimate, setCurrentEstimate, 
          addMaterial, updateMaterial, removeMaterial, addLabor, updateLabor, removeLabor } = useEstimateStore();
  const { getCustomer } = useCustomerStore();
  
  const customer = customerId ? getCustomer(customerId) : null;
  const estimate = currentEstimate;
  
  // Material form state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState<Partial<MaterialItem>>({
    name: '',
    quantity: 1,
    unit: 'gallon',
    unitPrice: 0,
    category: 'paint'
  });
  
  // Labor form state
  const [showLaborForm, setShowLaborForm] = useState(false);
  const [editingLabor, setEditingLabor] = useState<string | null>(null);
  const [laborForm, setLaborForm] = useState<Partial<LaborItem>>({
    description: '',
    painters: 2,
    days: 3,
    hoursPerDay: 8,
    hourlyRate: 35
  });

  // Initialize estimate
  useEffect(() => {
    if (!estimate && customer) {
      const newEstimate = createEstimate(
        customer.id,
        `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ''}`,
        `${customer.address}, ${customer.city}, ${customer.state}`
      );
      setCurrentEstimate(newEstimate);
    }
  }, [estimate, customer, createEstimate, setCurrentEstimate]);

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No customer selected</p>
          <button onClick={() => navigate('/customers')} className="btn-primary">
            Select a Customer
          </button>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pinpoint-navy"></div>
      </div>
    );
  }

  // Material form handlers
  const handleAddMaterial = () => {
    if (materialForm.name && materialForm.quantity && materialForm.unitPrice) {
      addMaterial(estimate.id, materialForm as Omit<MaterialItem, 'id'>);
      setMaterialForm({ name: '', quantity: 1, unit: 'gallon', unitPrice: 0, category: 'paint' });
      setShowMaterialForm(false);
    }
  };

  const handleUpdateMaterial = () => {
    if (editingMaterial && materialForm.name) {
      updateMaterial(estimate.id, editingMaterial, materialForm);
      setEditingMaterial(null);
      setMaterialForm({ name: '', quantity: 1, unit: 'gallon', unitPrice: 0, category: 'paint' });
    }
  };

  const startEditMaterial = (material: MaterialItem) => {
    setEditingMaterial(material.id);
    setMaterialForm({ ...material });
    setShowMaterialForm(true);
  };

  // Labor form handlers
  const handleAddLabor = () => {
    if (laborForm.description && laborForm.painters && laborForm.days) {
      addLabor(estimate.id, laborForm as Omit<LaborItem, 'id'>);
      setLaborForm({ description: '', painters: 2, days: 3, hoursPerDay: 8, hourlyRate: 35 });
      setShowLaborForm(false);
    }
  };

  const handleUpdateLabor = () => {
    if (editingLabor && laborForm.description) {
      updateLabor(estimate.id, editingLabor, laborForm);
      setEditingLabor(null);
      setLaborForm({ description: '', painters: 2, days: 3, hoursPerDay: 8, hourlyRate: 35 });
    }
  };

  const startEditLabor = (labor: LaborItem) => {
    setEditingLabor(labor.id);
    setLaborForm({ ...labor });
    setShowLaborForm(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">New Estimate</h1>
        </div>
        
        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="font-medium text-gray-900">{estimate.customerName}</p>
          <p className="text-sm text-gray-500">{estimate.customerAddress}</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Project Name */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
          <input
            type="text"
            value={estimate.projectName}
            onChange={(e) => updateEstimate(estimate.id, { projectName: e.target.value })}
            className="w-full input-field"
            placeholder="e.g., Exterior repaint - 123 Main St"
          />
        </div>

        {/* Scope of Work */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">Scope of Work</label>
          <textarea
            value={estimate.description || ''}
            onChange={(e) => updateEstimate(estimate.id, { description: e.target.value })}
            className="w-full input-field min-h-[80px]"
            placeholder="Describe the work to be done..."
          />
        </div>

        {/* Markup & Tax Settings */}
        <div className="card">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Markup
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={estimate.materialMarkupPercent}
                  onChange={(e) => updateEstimate(estimate.id, { materialMarkupPercent: Number(e.target.value) })}
                  className="w-20 input-field text-center"
                />
                <span className="ml-2 text-gray-500">% </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={estimate.taxRate}
                  onChange={(e) => updateEstimate(estimate.id, { taxRate: Number(e.target.value) })}
                  className="w-20 input-field text-center"
                />
                <span className="ml-2 text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Materials Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Materials</h2>
            <button
              onClick={() => {
                setEditingMaterial(null);
                setMaterialForm({ name: '', quantity: 1, unit: 'gallon', unitPrice: 0, category: 'paint' });
                setShowMaterialForm(true);
              }}
              className="flex items-center gap-1 text-sm text-pinpoint-blue font-medium"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {estimate.materials.length === 0 ? (
            <p className="text-gray-500 text-sm">No materials added yet</p>
          ) : (
            <div className="space-y-2">
              {estimate.materials.map((material) => (
                <div 
                  key={material.id}
                  onClick={() => startEditMaterial(material)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{material.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
                        {material.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {material.quantity} {material.unit} × {formatCurrency(material.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(material.quantity * material.unitPrice)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMaterial(estimate.id, material.id);
                      }}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Material Presets */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Quick Add</p>
            <div className="flex flex-wrap gap-2">
              {materialPresets.slice(0, 6).map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    addMaterial(estimate.id, { ...preset, quantity: 1 });
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  + {preset.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Labor Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Labor</h2>
            <button
              onClick={() => {
                setEditingLabor(null);
                setLaborForm({ description: '', painters: 2, days: 3, hoursPerDay: 8, hourlyRate: 35 });
                setShowLaborForm(true);
              }}
              className="flex items-center gap-1 text-sm text-pinpoint-blue font-medium"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {estimate.labor.length === 0 ? (
            <p className="text-gray-500 text-sm">No labor items added yet</p>
          ) : (
            <div className="space-y-2">
              {estimate.labor.map((labor) => (
                <div 
                  key={labor.id}
                  onClick={() => startEditLabor(labor)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{labor.description}</p>
                    <p className="text-sm text-gray-500">
                      {labor.painters} painters × {labor.days} days × {labor.hoursPerDay} hrs × ${labor.hourlyRate}/hr
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(labor.painters * labor.days * labor.hoursPerDay * labor.hourlyRate)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLabor(estimate.id, labor.id);
                      }}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">
              Materials: <span className="font-medium text-gray-900">{formatCurrency(estimate.subtotalMaterials)}</span>
              {estimate.materialMarkupPercent > 0 && (
                <span className="text-gray-400"> (+{formatCurrency(estimate.markupAmount)} markup)</span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Labor: <span className="font-medium text-gray-900">{formatCurrency(estimate.subtotalLabor)}</span>
            </div>
          </div>
          
          {estimate.taxAmount > 0 && (
            <div className="text-sm text-gray-500 mb-2">
              Tax ({estimate.taxRate}%): <span className="font-medium text-gray-900">{formatCurrency(estimate.taxAmount)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-pinpoint-navy">{formatCurrency(estimate.total)}</p>
              <p className="text-xs text-gray-500">Total Estimate</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/estimates/preview')}
                className="btn-secondary"
              >
                <FileText size={20} />
              </button>
              <button className="btn-primary">
                <Save size={20} className="mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Material Form Modal */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingMaterial ? 'Edit Material' : 'Add Material'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full input-field"
                  placeholder="e.g., Exterior Paint"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                  <input
                    type="number"
                    value={materialForm.quantity}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, unit: e.target.value as any }))}
                    className="w-full input-field"
                  >
                    <option value="gallon">Gallon</option>
                    <option value="quart">Quart</option>
                    <option value="each">Each</option>
                    <option value="case">Case</option>
                    <option value="roll">Roll</option>
                    <option value="sqft">Sq Ft</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <input
                    type="number"
                    value={materialForm.unitPrice}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                    className="w-full input-field"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={materialForm.category}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full input-field"
                  >
                    <option value="paint">Paint</option>
                    <option value="primer">Primer</option>
                    <option value="supply">Supply</option>
                    <option value="caulk">Caulk</option>
                    <option value="tape">Tape</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMaterialForm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingMaterial ? handleUpdateMaterial : handleAddMaterial}
                className="flex-1 btn-primary"
              >
                {editingMaterial ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Labor Form Modal */}
      {showLaborForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingLabor ? 'Edit Labor' : 'Add Labor'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={laborForm.description}
                  onChange={(e) => setLaborForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full input-field"
                  placeholder="e.g., Prep and paint exterior"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Painters</label>
                  <input
                    type="number"
                    value={laborForm.painters}
                    onChange={(e) => setLaborForm(prev => ({ ...prev, painters: Number(e.target.value) }))}
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                  <input
                    type="number"
                    value={laborForm.days}
                    onChange={(e) => setLaborForm(prev => ({ ...prev, days: Number(e.target.value) }))}
                    className="w-full input-field"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Day</label>
                  <input
                    type="number"
                    value={laborForm.hoursPerDay}
                    onChange={(e) => setLaborForm(prev => ({ ...prev, hoursPerDay: Number(e.target.value) }))}
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate/Hour</label>
                  <input
                    type="number"
                    value={laborForm.hourlyRate}
                    onChange={(e) => setLaborForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                    className="w-full input-field"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Estimated: <span className="font-medium">
                    {((laborForm.painters || 0) * (laborForm.days || 0) * (laborForm.hoursPerDay || 0)).toFixed(0)} hours
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Cost: <span className="font-medium text-gray-900">
                    {formatCurrency((laborForm.painters || 0) * (laborForm.days || 0) * (laborForm.hoursPerDay || 0) * (laborForm.hourlyRate || 0))}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLaborForm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingLabor ? handleUpdateLabor : handleAddLabor}
                className="flex-1 btn-primary"
              >
                {editingLabor ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};