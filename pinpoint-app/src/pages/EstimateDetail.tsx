import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEstimateStore } from '../stores/estimateStore';
import { useCustomerStore } from '../stores/customerStore';
import { Layout, Card, Badge, Button, Modal } from '../components';
import { EstimatePDF } from '../components/EstimatePDF';
import { shareViaSMS, shareViaEmail, copyEstimateToClipboard } from '../utils/shareEstimate';
import {
  MapPin,
  FileText,
  Pencil,
  FileDown,
  Send,
  MessageSquare,
  Mail,
  Copy,
  Check,
  ArrowLeft,
  ClipboardList,
  Users,
  Calendar,
  Layers,
} from 'lucide-react';

const categoryEmoji: Record<string, string> = {
  paint: '🎨',
  primer: '🎯',
  supply: '📦',
  caulk: '💧',
  tape: '📼',
  other: '📎',
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

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const EstimateDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { estimates } = useEstimateStore();
  const { getCustomer } = useCustomerStore();

  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const estimate = estimates.find((e) => e.id === id);
  const customer = estimate ? getCustomer(estimate.customerId) : undefined;

  // --- Not found ---
  if (!estimate) {
    return (
      <Layout showBack title="Estimate">
        <div className="flex items-center justify-center min-h-[60vh] px-5">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 flex items-center justify-center">
              <FileText size={28} className="text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Estimate not found</h2>
            <p className="text-slate-400 text-sm mb-6">
              This estimate may have been deleted or the link is invalid.
            </p>
            <Button icon={<ArrowLeft size={18} />} onClick={() => navigate('/estimates')}>
              Back to Estimates
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // --- Share handlers ---
  const handleShareSMS = async () => {
    await shareViaSMS(estimate);
    setShowShareMenu(false);
  };

  const handleShareEmail = () => {
    shareViaEmail(estimate);
    setShowShareMenu(false);
  };

  const handleCopyLink = async () => {
    const success = await copyEstimateToClipboard(estimate);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowShareMenu(false);
  };

  return (
    <Layout activeTab="estimates" showBack>
      <div className="pb-52">
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-white truncate">{estimate.projectName || 'Untitled Estimate'}</h1>
            <Badge variant={statusBadgeVariant(estimate.status)} size="md" showDot>
              {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
            </Badge>
          </div>

          {/* Customer Banner */}
          <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-white">{estimate.customerName}</p>
                <p className="text-sm text-slate-400 mt-1 break-words">{estimate.customerAddress}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="px-5 space-y-4">
          {/* Date & Meta */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              Created {formatDate(estimate.createdAt)}
            </span>
            {estimate.updatedAt !== estimate.createdAt && (
              <span className="flex items-center gap-1.5">
                Updated {formatDate(estimate.updatedAt)}
              </span>
            )}
          </div>

          {/* Description */}
          {estimate.description && (
            <Card>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                <FileText size={14} className="text-blue-400" />
                Description
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {estimate.description}
              </p>
            </Card>
          )}

          {/* Scope of Work */}
          {estimate.scopeOfWork.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                <ClipboardList size={14} className="text-blue-400" />
                Scope of Work
              </h3>
              <ul className="space-y-2">
                {estimate.scopeOfWork.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-slate-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Materials */}
          <Card>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
              <Layers size={14} className="text-blue-400" />
              Materials
              {estimate.materials.length > 0 && (
                <span className="text-xs font-normal text-slate-500 ml-auto">
                  {estimate.materials.length} item{estimate.materials.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>

            {estimate.materials.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No materials</p>
            ) : (
              <div className="space-y-2">
                {estimate.materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{categoryEmoji[material.category]}</span>
                        <span className="font-medium text-white text-sm truncate">{material.name}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {material.quantity} {material.unit} × {fmt(material.unitPrice)}
                      </p>
                    </div>
                    <p className="font-medium text-white text-sm flex-shrink-0 ml-3">
                      {fmt(material.quantity * material.unitPrice)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Labor */}
          <Card>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users size={14} className="text-blue-400" />
              Labor
              {estimate.labor.length > 0 && (
                <span className="text-xs font-normal text-slate-500 ml-auto">
                  {estimate.labor.length} item{estimate.labor.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>

            {estimate.labor.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No labor items</p>
            ) : (
              <div className="space-y-2">
                {estimate.labor.map((labor) => {
                  const laborTotal = labor.painters * labor.days * labor.hoursPerDay * labor.hourlyRate;
                  return (
                    <div
                      key={labor.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm mb-1 truncate">{labor.description}</p>
                        <p className="text-xs text-slate-400">
                          {labor.painters} painter{labor.painters !== 1 ? 's' : ''} × {labor.days} day{labor.days !== 1 ? 's' : ''} × {labor.hoursPerDay} hrs × ${labor.hourlyRate}/hr
                        </p>
                      </div>
                      <p className="font-medium text-white text-sm flex-shrink-0 ml-3">{fmt(laborTotal)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Cost Summary */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/60">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Cost Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Materials</span>
                <span className="text-white font-medium">{fmt(estimate.subtotalMaterials)}</span>
              </div>

              {estimate.markupAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Markup ({estimate.materialMarkupPercent}%)</span>
                  <span className="text-white font-medium">{fmt(estimate.markupAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Labor</span>
                <span className="text-white font-medium">{fmt(estimate.subtotalLabor)}</span>
              </div>

              {estimate.taxAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Tax ({estimate.taxRate}%)</span>
                  <span className="text-white font-medium">{fmt(estimate.taxAmount)}</span>
                </div>
              )}

              <div className="border-t border-slate-700/50 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {fmt(estimate.total)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-5 z-40">
        <div className="max-w-lg mx-auto">
          {/* Action Buttons */}
          <div className="flex gap-2 mb-3">
            <Button
              variant="secondary"
              size="md"
              icon={<Pencil size={18} />}
              onClick={() => navigate(`/estimates/new?customer=${estimate.customerId}&edit=${estimate.id}`)}
              fullWidth
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<FileDown size={18} />}
              onClick={() => setShowPDFModal(true)}
              fullWidth
            >
              PDF
            </Button>
          </div>

          {/* Share */}
          <div className="relative">
            <Button
              fullWidth
              size="md"
              icon={<Send size={18} />}
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 !text-white border-0 shadow-lg shadow-blue-500/20"
            >
              Share Estimate
            </Button>

            {/* Share Options Popup */}
            {showShareMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl shadow-black/40 animate-fade-in-up">
                <button
                  onClick={handleShareSMS}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-700/50 transition-colors active:scale-[0.98]"
                >
                  <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <MessageSquare size={18} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Send via SMS</p>
                    <p className="text-xs text-slate-400">Text estimate summary</p>
                  </div>
                </button>

                <div className="border-t border-slate-700/30" />

                <button
                  onClick={handleShareEmail}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-700/50 transition-colors active:scale-[0.98]"
                >
                  <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Send via Email</p>
                    <p className="text-xs text-slate-400">Open email with estimate</p>
                  </div>
                </button>

                <div className="border-t border-slate-700/30" />

                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-700/50 transition-colors active:scale-[0.98]"
                >
                  <div className="w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    {copied ? (
                      <Check size={18} className="text-green-400" />
                    ) : (
                      <Copy size={18} className="text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </p>
                    <p className="text-xs text-slate-400">Copy estimate text</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      {customer && (
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
      )}
    </Layout>
  );
};
