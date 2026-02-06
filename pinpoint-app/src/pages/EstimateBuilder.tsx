import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEstimateStore, type MaterialItem, type LaborItem, materialPresets } from '../stores/estimateStore';
import { useCustomerStore } from '../stores/customerStore';
import { Layout, Button, Modal, Input, Card } from '../components';
import { EstimatePDF } from '../components/EstimatePDF';
import { MapPin, Plus, X, FileText, Save, FileDown } from 'lucide-react';

const categoryEmoji: Record<string, string> = {
  paint: '🎨',
  primer: '🎯',
  supply: '📦',
  caulk: '💧',
  tape: '📼',
  other: '📎',
};

export const EstimateBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customer');

  const {
    createEstimate,
    updateEstimate,
    currentEstimate,
    setCurrentEstimate,
    addMaterial,
    updateMaterial,
    removeMaterial,
    addLabor,
    updateLabor,
    removeLabor,
  } = useEstimateStore();
  const { getCustomer } = useCustomerStore();

  const customer = customerId ? getCustomer(customerId) : null;
  const estimate = currentEstimate;

  // PDF modal state
  const [showPDFModal, setShowPDFModal] = useState(false);

  // Material form state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState<Partial<MaterialItem>>({
    name: '',
    quantity: 1,
    unit: 'gallon',
    unitPrice: 0,
    category: 'paint',
  });

  // Labor form state
  const [showLaborForm, setShowLaborForm] = useState(false);
  const [editingLabor, setEditingLabor] = useState<string | null>(null);
  const [laborForm, setLaborForm] = useState<Partial<LaborItem>>({
    description: '',
    painters: 2,
    days: 3,
    hoursPerDay: 8,
    hourlyRate: 35,
  });

  // Initialize estimate
  useEffect(() => {
    if (!estimate && customer) {
      const newEstimate = createEstimate(
        customer.id,
        `${customer.firstName} ${customer.lastName}`,
        `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`
      );
      setCurrentEstimate(newEstimate);
    }
  }, [estimate, customer, createEstimate, setCurrentEstimate]);

  if (!customer) {
    return (
      <Layout showBack title="No Customer Selected">
        <div className="flex items-center justify-center min-h-[60vh] px-5">
          <div className="text-center">
            <p className="text-slate-400 mb-4">No customer selected</p>
            <Button onClick={() => navigate('/customers')}>Select a Customer</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!estimate) {
    return (
      <Layout showBack title="Loading...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-blue-400 text-2xl">◆</div>
        </div>
      </Layout>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  // Material form handlers
  const handleAddMaterial = () => {
    if (materialForm.name && materialForm.quantity && materialForm.unitPrice !== undefined) {
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
      setShowMaterialForm(false);
    }
  };

  const startEditMaterial = (material: MaterialItem) => {
    setEditingMaterial(material.id);
    setMaterialForm({ ...material });
    setShowMaterialForm(true);
  };

  const cancelMaterialForm = () => {
    setShowMaterialForm(false);
    setEditingMaterial(null);
    setMaterialForm({ name: '', quantity: 1, unit: 'gallon', unitPrice: 0, category: 'paint' });
  };

  // Labor form handlers
  const handleAddLabor = () => {
    if (
      laborForm.description &&
      laborForm.painters &&
      laborForm.days &&
      laborForm.hoursPerDay &&
      laborForm.hourlyRate !== undefined
    ) {
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
      setShowLaborForm(false);
    }
  };

  const startEditLabor = (labor: LaborItem) => {
    setEditingLabor(labor.id);
    setLaborForm({ ...labor });
    setShowLaborForm(true);
  };

  const cancelLaborForm = () => {
    setShowLaborForm(false);
    setEditingLabor(null);
    setLaborForm({ description: '', painters: 2, days: 3, hoursPerDay: 8, hourlyRate: 35 });
  };

  const laborTotal =
    (laborForm.painters || 0) * (laborForm.days || 0) * (laborForm.hoursPerDay || 0) * (laborForm.hourlyRate || 0);

  return (
    <Layout activeTab="estimates" showBack>
      <div className="pb-48">
        {/* Customer Info Banner */}
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-white mb-3">New Estimate</h1>
          <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">{estimate.customerName}</p>
                <p className="text-sm text-slate-400 mt-1">{estimate.customerAddress}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Form Content */}
        <div className="px-5 space-y-4">
          {/* Project Name */}
          <Card>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Project Name</h3>
            <Input
              value={estimate.projectName}
              onChange={e => updateEstimate(estimate.id, { projectName: e.target.value })}
              placeholder="e.g., Exterior repaint - 123 Main St"
            />
          </Card>

          {/* Scope of Work */}
          <Card>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Scope of Work</h3>
            <textarea
              value={estimate.description || ''}
              onChange={e => updateEstimate(estimate.id, { description: e.target.value })}
              className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none min-h-[100px] resize-none"
              placeholder="Describe the work to be done..."
            />
          </Card>

          {/* Markup & Tax Settings */}
          <Card>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-2">Material Markup</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={estimate.materialMarkupPercent}
                    onChange={e =>
                      updateEstimate(estimate.id, { materialMarkupPercent: Number(e.target.value) })
                    }
                    className="text-center"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Tax Rate</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={estimate.taxRate}
                    onChange={e => updateEstimate(estimate.id, { taxRate: Number(e.target.value) })}
                    className="text-center"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Materials Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                📦 Materials
              </h3>
              <Button
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingMaterial(null);
                  setMaterialForm({ name: '', quantity: 1, unit: 'gallon', unitPrice: 0, category: 'paint' });
                  setShowMaterialForm(true);
                }}
              >
                Add
              </Button>
            </div>

            {estimate.materials.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No materials added yet</p>
            ) : (
              <div className="space-y-2">
                {estimate.materials.map(material => (
                  <div
                    key={material.id}
                    onClick={() => startEditMaterial(material)}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{categoryEmoji[material.category]}</span>
                        <span className="font-medium text-white text-sm">{material.name}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {material.quantity} {material.unit} × {fmt(material.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className="font-medium text-white">{fmt(material.quantity * material.unitPrice)}</p>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          removeMaterial(estimate.id, material.id);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X size={16} />
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
                    className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg text-sm text-slate-300 transition-colors"
                  >
                    + {preset.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Labor Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                👷 Labor
              </h3>
              <Button
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingLabor(null);
                  setLaborForm({ description: '', painters: 2, days: 3, hoursPerDay: 8, hourlyRate: 35 });
                  setShowLaborForm(true);
                }}
              >
                Add
              </Button>
            </div>

            {estimate.labor.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No labor items added yet</p>
            ) : (
              <div className="space-y-2">
                {estimate.labor.map(labor => (
                  <div
                    key={labor.id}
                    onClick={() => startEditLabor(labor)}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700/30"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm mb-1">{labor.description}</p>
                      <p className="text-xs text-slate-400">
                        {labor.painters} painters × {labor.days} days × {labor.hoursPerDay} hrs × $
                        {labor.hourlyRate}/hr
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className="font-medium text-white">
                        {fmt(labor.painters * labor.days * labor.hoursPerDay * labor.hourlyRate)}
                      </p>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          removeLabor(estimate.id, labor.id);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-5 z-40">
        <div className="max-w-lg mx-auto">
          {/* Subtotals */}
          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="text-slate-400">
              Materials: <span className="font-medium text-white">{fmt(estimate.subtotalMaterials)}</span>
              {estimate.materialMarkupPercent > 0 && (
                <span className="text-slate-500"> (+{fmt(estimate.markupAmount)} markup)</span>
              )}
            </div>
            <div className="text-slate-400">
              Labor: <span className="font-medium text-white">{fmt(estimate.subtotalLabor)}</span>
            </div>
          </div>

          {/* Tax */}
          {estimate.taxAmount > 0 && (
            <div className="text-sm text-slate-400 mb-3">
              Tax ({estimate.taxRate}%):{' '}
              <span className="font-medium text-white">{fmt(estimate.taxAmount)}</span>
            </div>
          )}

          {/* Total and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {fmt(estimate.total)}
              </p>
              <p className="text-xs text-slate-500">Total Estimate</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                icon={<FileDown size={18} />}
                onClick={() => setShowPDFModal(true)}
              >
                PDF
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<FileText size={18} />}
                onClick={() => navigate('/estimates/preview')}
              >
                Preview
              </Button>
              <Button size="md" icon={<Save size={18} />} onClick={() => navigate('/estimates')}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Material Form Modal */}
      <Modal
        isOpen={showMaterialForm}
        onClose={cancelMaterialForm}
        title={editingMaterial ? 'Edit Material' : 'Add Material'}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={materialForm.name}
            onChange={e => setMaterialForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Exterior Paint"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              value={materialForm.quantity}
              onChange={e => setMaterialForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
            />
            <div>
              <label className="text-xs text-slate-400 block mb-2">Unit</label>
              <select
                value={materialForm.unit}
                onChange={e => setMaterialForm(prev => ({ ...prev, unit: e.target.value as any }))}
                className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
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
            <Input
              label="Unit Price"
              type="number"
              step="0.01"
              value={materialForm.unitPrice}
              onChange={e => setMaterialForm(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
            />
            <div>
              <label className="text-xs text-slate-400 block mb-2">Category</label>
              <select
                value={materialForm.category}
                onChange={e => setMaterialForm(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
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

          {/* Calculated Total */}
          {materialForm.quantity && materialForm.unitPrice !== undefined && (
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-sm text-slate-400">
                Total: <span className="font-medium text-white">{fmt(materialForm.quantity * materialForm.unitPrice)}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" fullWidth onClick={cancelMaterialForm}>
            Cancel
          </Button>
          <Button fullWidth onClick={editingMaterial ? handleUpdateMaterial : handleAddMaterial}>
            {editingMaterial ? 'Update' : 'Add'}
          </Button>
        </div>
      </Modal>

      {/* Labor Form Modal */}
      <Modal
        isOpen={showLaborForm}
        onClose={cancelLaborForm}
        title={editingLabor ? 'Edit Labor' : 'Add Labor'}
      >
        <div className="space-y-4">
          <Input
            label="Description"
            value={laborForm.description}
            onChange={e => setLaborForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="e.g., Prep and paint exterior"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Painters"
              type="number"
              value={laborForm.painters}
              onChange={e => setLaborForm(prev => ({ ...prev, painters: Number(e.target.value) }))}
            />
            <Input
              label="Days"
              type="number"
              value={laborForm.days}
              onChange={e => setLaborForm(prev => ({ ...prev, days: Number(e.target.value) }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hours/Day"
              type="number"
              value={laborForm.hoursPerDay}
              onChange={e => setLaborForm(prev => ({ ...prev, hoursPerDay: Number(e.target.value) }))}
            />
            <Input
              label="Rate/Hour"
              type="number"
              step="0.01"
              value={laborForm.hourlyRate}
              onChange={e => setLaborForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
            />
          </div>

          {/* Live Calculation */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">
              Total Hours:{' '}
              <span className="font-medium text-white">
                {((laborForm.painters || 0) * (laborForm.days || 0) * (laborForm.hoursPerDay || 0)).toFixed(0)}
              </span>
            </p>
            <p className="text-sm text-slate-400">
              Total Cost: <span className="font-medium text-white">{fmt(laborTotal)}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" fullWidth onClick={cancelLaborForm}>
            Cancel
          </Button>
          <Button fullWidth onClick={editingLabor ? handleUpdateLabor : handleAddLabor}>
            {editingLabor ? 'Update' : 'Add'}
          </Button>
        </div>
      </Modal>

      {/* PDF Generation Modal */}
      <Modal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        title="Generate Estimate PDF"
      >
        <EstimatePDF
          estimate={estimate}
          customer={customer}
          onClose={() => setShowPDFModal(false)}
        />
      </Modal>
    </Layout>
  );
};
