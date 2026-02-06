import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEstimateStore, type MaterialItem, type LaborItem, materialPresets } from '../stores/estimateStore';
import { useCustomerStore } from '../stores/customerStore';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No customer selected</p>
          <button onClick={() => navigate('/customers')} className="btn-primary">
            Select a Customer
          </button>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-blue-400 text-2xl">◆</div>
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

  const categoryEmoji = {
    'paint': '🎨',
    'primer': '🎯', 
    'supply': '📦',
    'caulk': '💧',
    'tape': '📼',
    'other': '📎'
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-40">
      {/* Header */}
      <header className="app-header px-5 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/customers')}
            className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center text-xl font-medium"
          >
            ‹
          </button>
          <h1 className="font-bold text-white text-lg">New Estimate</h1>
        </div>
        
        {/* Customer Info */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="font-semibold text-white">{estimate.customerName}</p>
          <p className="text-sm text-slate-400 mt-1">📍 {estimate.customerAddress}</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-5 space-y-4">
        {/* Project Name */}
        <div className="app-card">
          <label className="section-title block mb-2">Project Name</label>
          <input
            type="text"
            value={estimate.projectName}
            onChange={(e) => updateEstimate(estimate.id, { projectName: e.target.value })}
            className="w-full input-field"
            placeholder="e.g., Exterior repaint - 123 Main St"
          />
        </div>

        {/* Scope of Work */}
        <div className="app-card">
          <label className="section-title block mb-2">Scope of Work</label>
          <textarea
            value={estimate.description || ''}
            onChange={(e) => updateEstimate(estimate.id, { description: e.target.value })}
            className="w-full input-field min-h-[80px]"
            placeholder="Describe the work to be done..."
          />
        </div>

        {/* Markup & Tax Settings */}
        <div className="app-card">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-title block mb-1">
                Material Markup
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={estimate.materialMarkupPercent}
                  onChange={(e) => updateEstimate(estimate.id, { materialMarkupPercent: Number(e.target.value) })}
                  className="w-20 input-field text-center"
                />
                <span className="ml-2 text-slate-400">%</span>
              </div>
            </div>
            <div>
              <label className="section-title block mb-1">
                Tax Rate
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={estimate.taxRate}
                  onChange={(e) => updateEstimate(estimate.id, { taxRate: Number(e.target.value) })}
                  className="w-20 input-field text-center"
                />
                <span className="ml-2 text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Materials Section */}
        <div className="app-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span>📦</span> Materials
            </h2>
            <button
              onClick={() => {
                setEditingMaterial(null);
                setMaterialForm({ name: '', quantity: 1, unit: 'gallon', unitPrice: 0, category: 'paint' });
                setShowMaterialForm(true);
              }}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              <span className="text-lg">+</span> Add
            </button>
          </div>

          {estimate.materials.length === 0 ? (
            <p className="text-slate-500 text-sm">No materials added yet</p>
          ) : (
            <div className="space-y-2">
              {estimate.materials.map((material) => (
                <div 
                  key={material.id}
                  onClick={() => startEditMaterial(material)}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{categoryEmoji[material.category]}</span>
                      <span className="font-medium text-white">{material.name}</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {material.quantity} {material.unit} × {formatCurrency(material.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">
                      {formatCurrency(material.quantity * material.unitPrice)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMaterial(estimate.id, material.id);
                      }}
                      className="text-red-400 text-xs hover:text-red-300"
                    >
                      × Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Material Presets */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-xs font-medium text-slate-500 uppercase mb-2">Quick Add</p>
            <div className="flex flex-wrap gap-2">
              {materialPresets.slice(0, 6).map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    addMaterial(estimate.id, { ...preset, quantity: 1 });
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                >
                  + {preset.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Labor Section */}
        <div className="app-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span>👷</span> Labor
            </h2>
            <button
              onClick={() => {
                setEditingLabor(null);
                setLaborForm({ description: '', painters: 2, days: 3, hoursPerDay: 8, hourlyRate: 35 });
                setShowLaborForm(true);
              }}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              <span className="text-lg">+</span> Add
            </button>
          </div>

          {estimate.labor.length === 0 ? (
            <p className="text-slate-500 text-sm">No labor items added yet</p>
          ) : (
            <div className="space-y-2">
              {estimate.labor.map((labor) => (
                <div 
                  key={labor.id}
                  onClick={() => startEditLabor(labor)}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700/30"
                >
                  <div className="flex-1">
                    <p className="font-medium text-white">{labor.description}</p>
                    <p className="text-sm text-slate-400">
                      {labor.painters} painters × {labor.days} days × {labor.hoursPerDay} hrs × ${labor.hourlyRate}/hr
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">
                      {formatCurrency(labor.painters * labor.days * labor.hoursPerDay * labor.hourlyRate)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLabor(estimate.id, labor.id);
                      }}
                      className="text-red-400 text-xs hover:text-red-300"
                    >
                      × Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-5 z-40">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="text-slate-400">
              Materials: <span className="font-medium text-white">{formatCurrency(estimate.subtotalMaterials)}</span>
              {estimate.materialMarkupPercent > 0 && (
                <span className="text-slate-500"> (+{formatCurrency(estimate.markupAmount)} markup)</span>
              )}
            </div>
            <div className="text-slate-400">
              Labor: <span className="font-medium text-white">{formatCurrency(estimate.subtotalLabor)}</span>
            </div>
          </div>
          
          {estimate.taxAmount > 0 && (
            <div className="text-sm text-slate-400 mb-2">
              Tax ({estimate.taxRate}%): <span className="font-medium text-white">{formatCurrency(estimate.taxAmount)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gradient">{formatCurrency(estimate.total)}</p>
              <p className="text-xs text-slate-500">Total Estimate</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/estimates/preview')}
                className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center text-xl"
              >
                📄
              </button>
              <button className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-glow flex items-center gap-2 hover:shadow-glow-lg transition-all">
                <span>💾</span> Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Material Form Modal */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="app-card rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingMaterial ? 'Edit Material' : 'Add Material'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="section-title block mb-1">Name</label>
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
                  <label className="section-title block mb-1">Qty</label>
                  <input
                    type="number"
                    value={materialForm.quantity}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="section-title block mb-1">Unit</label>
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
                  <label className="section-title block mb-1">Unit Price</label>
                  <input
                    type="number"
                    value={materialForm.unitPrice}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                    className="w-full input-field"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="section-title block mb-1">Category</label>
                  <select
                    value={materialForm.category}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full input-field"
                  >
                    <option value="paint">🎨 Paint</option>
                    <option value="primer">🎯 Primer</option>
                    <option value="supply">📦 Supply</option>
                    <option value="caulk">💧 Caulk</option>
                    <option value="tape">📼 Tape</option>
                    <option value="other">📎 Other</option>
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
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="app-card rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingLabor ? 'Edit Labor' : 'Add Labor'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="section-title block mb-1">Description</label>
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
                  <label className="section-title block mb-1">Painters</label>
                  <input
                    type="number"
                    value={laborForm.painters}
                    onChange={(e) => setLaborForm(prev => ({ ...prev, painters: Number(e.target.value) }))}
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="section-title block mb-1">Days</label>
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
                  <label className="section-title block mb-1">Hours/Day</label>
                  <input
                    type="number"
                    value={laborForm.hoursPerDay}
                    onChange={(e) => setLaborForm(prev => ({ ...prev, hoursPerDay: Number(e.target.value) }))}
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="section-title block mb-1">Rate/Hour</label>
                  <input
                    type="number"
                    value={laborForm.hourlyRate}
                    onChange={(e) => setLaborForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                    className="w-full input-field"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-sm text-slate-400">
                  Estimated: <span className="font-medium text-white">
                    {((laborForm.painters || 0) * (laborForm.days || 0) * (laborForm.hoursPerDay || 0)).toFixed(0)} hours
                  </span>
                </p>
                <p className="text-sm text-slate-400">
                  Cost: <span className="font-medium text-white">
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
