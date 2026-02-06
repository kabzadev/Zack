import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Button } from '../components';
import { VoiceAgent, type VoiceEstimateData } from '../components/VoiceAgent';
import { useVoiceDraftStore } from '../stores/voiceDraftStore';
import { useEstimateStore } from '../stores/estimateStore';
import { useCustomerStore } from '../stores/customerStore';
import { telemetry } from '../utils/telemetry';
import {
  Mic,
  User,
  MapPin,
  Home,
  Palette,
  Users,
  DollarSign,
  Droplets,
  FileText,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wrench,
} from 'lucide-react';

const AGENT_ID = 'agent_0101kgrqw8nxenkrabks597t1nf8';

type PageState = 'idle' | 'recording' | 'review';

export const VoiceEstimate = () => {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('idle');
  const [estimateData, setEstimateData] = useState<VoiceEstimateData | null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [resumeDraftId, setResumeDraftId] = useState<string | undefined>(undefined);

  const store = useVoiceDraftStore();
  const estimateStore = useEstimateStore();
  const incompleteDrafts = store.getIncompleteDrafts();

  const handleStartNew = useCallback(() => {
    telemetry.voice('start_new');
    setResumeDraftId(undefined);
    store.setActiveDraft(null);
    setShowAgent(true);
    setPageState('recording');
  }, [store]);

  const handleResumeDraft = useCallback((draftId: string) => {
    telemetry.voice('resume_draft', { draftId });
    setResumeDraftId(draftId);
    store.setActiveDraft(draftId);
    setShowAgent(true);
    setPageState('recording');
  }, [store]);

  const handleEstimateReady = useCallback((data: VoiceEstimateData) => {
    telemetry.voice('estimate_ready', { customer: data.draft?.customerName, areas: data.draft?.areas?.length });
    setEstimateData(data);
    setShowAgent(false);
    setPageState('review');
    
    // Auto-create estimate if we have enough data
    const pct = store.getCompletionPercent(data.draft.id);
    if (pct >= 80) {
      // Delay slightly so user sees the review briefly
      setTimeout(() => {
        // Will be handled by the review page's auto-create
      }, 100);
    }
  }, [store]);

  const handleCloseAgent = useCallback(() => {
    setShowAgent(false);
    if (!estimateData) setPageState('idle');
  }, [estimateData]);

  const customerStore = useCustomerStore();
  
  const handleCreateEstimate = useCallback(() => {
    if (!estimateData) return;
    const d = estimateData.draft;

    // Try to find a matching customer by name
    let customerId = '';
    if (d.customerName) {
      const results = customerStore.searchCustomers({ search: d.customerName });
      if (results.length > 0) {
        customerId = results[0].id;
      }
    }
    
    // If no customer match found, create a new one
    if (!customerId && d.customerName) {
      const nameParts = d.customerName.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Parse address parts
      const addrParts = (d.propertyAddress || '').split(',').map(s => s.trim());
      
      const newCustomer = customerStore.addCustomer({
        firstName,
        lastName,
        phone: d.customerPhone || '',
        email: d.customerEmail || '',
        address: addrParts[0] || '',
        city: addrParts[1] || '',
        state: addrParts[2] || '',
        zipCode: addrParts[3] || '',
        type: 'homeowner',
        status: 'active',
        tags: ['voice-estimate'],
        notes: `Created from voice estimate on ${new Date().toLocaleDateString()}`,
      });
      customerId = newCustomer.id;
    }
    
    if (!customerId) customerId = `voice-${d.id}`;
    
    const estimate = estimateStore.createEstimate(
      customerId,
      d.customerName || 'Voice Estimate',
      d.propertyAddress || ''
    );

    // Build project name: "Keith Kabza — Interior Paint" or "Customer — Exterior"
    const typePart = d.projectType
      ? `${d.projectType.charAt(0).toUpperCase() + d.projectType.slice(1)} Paint${d.areas.length > 0 ? ` — ${d.areas.slice(0, 3).join(', ')}` : ''}`
      : d.areas.length > 0 ? d.areas.slice(0, 3).join(', ') : 'Paint Estimate';
    const projectName = d.customerName ? `${d.customerName} — ${typePart}` : typePart;

    // Convert voice draft paint items to material items
    const materials = d.paintItems.map((p, i) => ({
      id: `vm-${i}`,
      name: `${p.product}${p.color ? ` (${p.color})` : ''}${p.finish ? ` — ${p.finish}` : ''}`,
      quantity: p.gallons,
      unit: 'gallon' as const,
      unitPrice: p.pricePerGallon,
      category: 'paint' as const,
    }));

    // Convert voice draft labor to labor items
    const labor = d.numberOfPainters && d.estimatedDays ? [{
      id: 'vl-1',
      description: d.scopeOfWork.length > 0 ? d.scopeOfWork.join(', ') : `${d.projectType || 'Paint'} work`,
      painters: d.numberOfPainters,
      days: d.estimatedDays,
      hoursPerDay: d.hoursPerDay || 8,
      hourlyRate: d.hourlyRate || 65,
    }] : [];

    // Build scope of work including color assignments
    const scopeOfWork = [
      ...d.scopeOfWork,
      ...d.colorAssignments.map(c => `${c.area}: ${c.color} (${c.swCode})`),
    ];

    // Update the estimate with all voice data
    estimateStore.updateEstimate(estimate.id, {
      projectName,
      description: `Created via voice estimate${d.conversationHistory.length > 0 ? ` (${d.conversationHistory.length} messages)` : ''}`,
      scopeOfWork,
      materials,
      labor,
      materialMarkupPercent: d.materialMarkupPercent,
      taxRate: d.taxRate,
      status: 'draft',
    });

    // Link the voice draft to this estimate
    store.markComplete(d.id);
    store.linkToEstimate(d.id, estimate.id);

    // Navigate to the estimates list so they can see it
    navigate('/estimates');
  }, [estimateData, estimateStore, store, navigate]);

  const handleStartOver = useCallback(() => {
    setEstimateData(null);
    setResumeDraftId(undefined);
    setPageState('idle');
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <Layout activeTab="voice-estimate">
      <div className="px-5 pt-6 pb-32">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Voice Estimate</h1>
              <p className="text-sm text-slate-400">Build estimates by talking</p>
            </div>
          </div>
        </div>

        {/* Idle State */}
        {pageState === 'idle' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Resume incomplete drafts */}
            {incompleteDrafts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={14} />
                  In Progress
                </h3>
                <div className="space-y-3">
                  {incompleteDrafts.map((draft) => {
                    const pct = store.getCompletionPercent(draft.id);
                    const missing = store.getMissingFields(draft.id);
                    return (
                      <div key={draft.id} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 hover:border-blue-500/30 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">
                              {draft.customerName || 'Unnamed Estimate'}
                            </p>
                            {draft.propertyAddress && (
                              <p className="text-xs text-slate-500 mt-0.5">{draft.propertyAddress}</p>
                            )}
                          </div>
                          <button
                            onClick={() => store.deleteDraft(draft.id)}
                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-600">{draft.conversationHistory.length} messages • {formatTimeAgo(draft.updatedAt)}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{pct}% complete</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {/* What's collected vs missing */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {draft.customerName && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5"><CheckCircle2 size={8} /> Customer</span>}
                          {draft.projectType && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5"><CheckCircle2 size={8} /> {draft.projectType}</span>}
                          {draft.laborCost != null && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5"><CheckCircle2 size={8} /> {fmt(draft.laborCost)} labor</span>}
                          {draft.paintItems.length > 0 && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5"><CheckCircle2 size={8} /> {draft.paintItems.reduce((s, p) => s + p.gallons, 0)} gal</span>}
                          {missing.slice(0, 2).map((m, i) => (
                            <span key={i} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                              <AlertCircle size={8} /> {m}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => handleResumeDraft(draft.id)}
                          className="w-full py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-sm rounded-xl hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <Mic size={16} /> Continue Conversation
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New estimate mic button */}
            <div className="flex flex-col items-center pt-4">
              <div className="relative mb-8">
                <div className="absolute inset-0 -m-6 rounded-full bg-blue-500/5 animate-pulse" />
                <button
                  onClick={handleStartNew}
                  className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-[0_16px_64px_rgba(59,130,246,0.4)] hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <Mic size={44} className="text-white" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {incompleteDrafts.length > 0 ? 'New Estimate' : 'Start Voice Estimate'}
              </h2>
              <p className="text-slate-400 text-center text-sm max-w-[300px] leading-relaxed mb-6">
                The assistant collects everything: customer info, labor, materials, colors, prep work, and calculates your totals.
              </p>

              <Card className="w-full">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">What it collects</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: <User size={14} />, text: 'Customer & address' },
                    { icon: <Home size={14} />, text: 'Rooms & areas' },
                    { icon: <Users size={14} />, text: 'Crew & schedule' },
                    { icon: <DollarSign size={14} />, text: 'Rate & labor cost' },
                    { icon: <Droplets size={14} />, text: 'Paint & gallons' },
                    { icon: <Palette size={14} />, text: 'SW colors' },
                    { icon: <Wrench size={14} />, text: 'Prep & add-ons' },
                    { icon: <FileText size={14} />, text: 'Complete estimate' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-400 text-xs">
                      <span className="text-blue-400">{item.icon}</span>
                      {item.text}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Review State */}
        {pageState === 'review' && estimateData && (() => {
          const d = estimateData.draft;
          const missing = store.getMissingFields(d.id);
          const pct = store.getCompletionPercent(d.id);
          
          const items = [
            { icon: <User size={16} />, label: 'Customer', value: d.customerName || '—', ok: !!d.customerName, color: 'blue' },
            { icon: <MapPin size={16} />, label: 'Address', value: d.propertyAddress || '—', ok: !!d.propertyAddress, color: 'cyan' },
            { icon: <Home size={16} />, label: 'Project', value: d.projectType ? `${d.projectType}${d.areas.length > 0 ? ` — ${d.areas.join(', ')}` : ''}` : '—', ok: !!d.projectType, color: 'emerald' },
            { icon: <Users size={16} />, label: 'Crew', value: d.numberOfPainters ? `${d.numberOfPainters} painters × ${d.estimatedDays || '?'} days × ${d.hoursPerDay || 8}hrs` : '—', ok: !!d.numberOfPainters, color: 'indigo' },
            { icon: <DollarSign size={16} />, label: 'Rate', value: d.hourlyRate ? `$${d.hourlyRate}/hr` : '—', ok: !!d.hourlyRate, color: 'green' },
            { icon: <DollarSign size={16} />, label: 'Labor Cost', value: d.laborCost ? fmt(d.laborCost) : '—', ok: !!d.laborCost, color: 'emerald' },
            { icon: <Droplets size={16} />, label: 'Paint', value: d.paintItems.length > 0 ? d.paintItems.map(p => `${p.gallons}gal ${p.product} (${p.area})`).join(', ') : '—', ok: d.paintItems.length > 0, color: 'purple' },
            { icon: <Palette size={16} />, label: 'Colors', value: d.colorAssignments.length > 0 ? d.colorAssignments.map(c => `${c.color} ${c.swCode}`).join(', ') : '—', ok: d.colorAssignments.length > 0, color: 'amber' },
            { icon: <Wrench size={16} />, label: 'Prep Work', value: d.scopeOfWork.length > 0 ? d.scopeOfWork.join(', ') : '—', ok: d.scopeOfWork.length > 0, color: 'slate' },
          ];

          return (
            <div className="space-y-4 animate-fade-in-up">
              {/* Completion banner */}
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                pct >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  pct >= 80 ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                }`}>
                  {pct >= 80 ? <CheckCircle2 size={20} className="text-emerald-400" /> : <AlertCircle size={20} className="text-amber-400" />}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${pct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {pct >= 80 ? 'Estimate Ready' : `${pct}% Complete — Missing ${missing.length} fields`}
                  </p>
                  {missing.length > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Still need: {missing.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Estimate total */}
              {d.estimateTotal != null && d.estimateTotal > 0 && (
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-5 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Estimated Total</p>
                  <p className="text-3xl font-bold text-white">{fmt(d.estimateTotal)}</p>
                  <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500">
                    {d.laborCost != null && <span>Labor: {fmt(d.laborCost)}</span>}
                    {d.materialSubtotal != null && <span>Materials: {fmt(d.materialSubtotal)}</span>}
                  </div>
                </div>
              )}

              {/* Detail fields */}
              <Card>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Estimate Details</h3>
                <div className="space-y-2.5">
                  {items.map((item, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                      item.ok ? 'bg-slate-800/40 border-slate-700/30' : 'bg-amber-500/5 border-amber-500/15'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.ok ? `bg-${item.color}-500/10 text-${item.color}-400` : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {item.ok ? item.icon : <AlertCircle size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 font-medium">{item.label}</p>
                        <p className={`text-sm font-medium ${item.ok ? 'text-white' : 'text-amber-400/60 italic'}`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Transcript */}
              {estimateData.rawTranscript && (
                <Card>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Transcript</h3>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar">
                    <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">{estimateData.rawTranscript}</p>
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <Button fullWidth size="lg" icon={<ChevronRight size={20} />} onClick={handleCreateEstimate}>
                  {pct >= 80 ? 'Create Estimate' : 'Create Estimate (Partial)'}
                </Button>
                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth icon={<Mic size={18} />} onClick={() => { setResumeDraftId(estimateData.draft.id); setShowAgent(true); setPageState('recording'); }}>
                    {missing.length > 0 ? 'Fill Missing Fields' : 'Add More Info'}
                  </Button>
                  <Button variant="ghost" fullWidth icon={<RotateCcw size={18} />} onClick={handleStartOver}>
                    Start Over
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <VoiceAgent
        isOpen={showAgent}
        onClose={handleCloseAgent}
        onEstimateReady={handleEstimateReady}
        agentId={AGENT_ID}
        draftId={resumeDraftId}
      />
    </Layout>
  );
};
