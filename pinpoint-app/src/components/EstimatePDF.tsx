import { useState } from 'react';
import { Download, MessageSquare, Mail, Check, FileText, Share2 } from 'lucide-react';
import { Button, Card } from './index';
import { downloadEstimatePDF, getEstimatePDFBlob } from '../utils/generatePDF';
import type { Estimate } from '../stores/estimateStore';
import type { Customer } from '../stores/customerStore';

interface EstimatePDFProps {
  estimate: Estimate;
  customer: Customer;
  onClose?: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export const EstimatePDF: React.FC<EstimatePDFProps> = ({ estimate, customer, onClose }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleDownload = () => {
    downloadEstimatePDF(estimate, customer);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const handleShareSMS = async () => {
    setSharing(true);
    try {
      const fullName = `${customer.firstName} ${customer.lastName}`;
      const message = `Hi ${customer.firstName}, here is your estimate from Pinpoint Painting for "${estimate.projectName}" — Total: ${fmt(estimate.total)}. We'll send the full PDF shortly!`;

      if (navigator.share) {
        const blob = getEstimatePDFBlob(estimate, customer);
        const file = new File(
          [blob],
          `Pinpoint_Estimate_${estimate.projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          { type: 'application/pdf' }
        );
        await navigator.share({
          title: `Estimate for ${fullName}`,
          text: message,
          files: [file],
        });
      } else {
        const smsUrl = `sms:${customer.phone}?body=${encodeURIComponent(message)}`;
        window.open(smsUrl, '_blank');
      }
    } catch {
      // User cancelled share or not supported - fallback to SMS link
      const message = `Hi ${customer.firstName}, your Pinpoint Painting estimate for "${estimate.projectName}" is ${fmt(estimate.total)}.`;
      const smsUrl = `sms:${customer.phone}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl, '_blank');
    } finally {
      setSharing(false);
    }
  };

  const handleShareEmail = () => {
    const subject = `Pinpoint Painting Estimate for ${customer.firstName} ${customer.lastName} — ${estimate.projectName}`;
    const body = [
      `Hi ${customer.firstName},`,
      '',
      `Thank you for considering Pinpoint Painting! Please find below the summary of your estimate for "${estimate.projectName}".`,
      '',
      `Materials: ${fmt(estimate.subtotalMaterials)}`,
      estimate.materialMarkupPercent > 0 ? `Markup (${estimate.materialMarkupPercent}%): ${fmt(estimate.markupAmount)}` : '',
      `Tax (${estimate.taxRate}%): ${fmt(estimate.taxAmount)}`,
      `Labor: ${fmt(estimate.subtotalLabor)}`,
      `——————————————`,
      `Total: ${fmt(estimate.total)}`,
      '',
      'A full PDF copy is attached separately.',
      '',
      'Best regards,',
      'Pinpoint Painting',
    ]
      .filter(Boolean)
      .join('\n');

    const emailTo = customer.email || '';
    window.open(
      `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      '_blank'
    );
  };

  return (
    <div className="space-y-4">
      {/* Preview Card */}
      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Estimate Summary</h3>
            <p className="text-xs text-slate-400">{estimate.projectName}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-4 p-3 bg-slate-800/50 rounded-xl">
          <p className="text-sm font-medium text-white">
            {customer.firstName} {customer.lastName}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{customer.phone}</p>
          <p className="text-xs text-slate-400">
            {customer.address}, {customer.city}, {customer.state} {customer.zipCode}
          </p>
        </div>

        {/* Line Items Summary */}
        <div className="space-y-2 mb-4">
          {estimate.materials.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                Materials ({estimate.materials.length} item{estimate.materials.length !== 1 ? 's' : ''})
              </span>
              <span className="text-white font-medium">{fmt(estimate.subtotalMaterials)}</span>
            </div>
          )}
          {estimate.materialMarkupPercent > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Markup ({estimate.materialMarkupPercent}%)</span>
              <span className="text-white font-medium">{fmt(estimate.markupAmount)}</span>
            </div>
          )}
          {estimate.taxAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Tax ({estimate.taxRate}%)</span>
              <span className="text-white font-medium">{fmt(estimate.taxAmount)}</span>
            </div>
          )}
          {estimate.labor.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                Labor ({estimate.labor.length} item{estimate.labor.length !== 1 ? 's' : ''})
              </span>
              <span className="text-white font-medium">{fmt(estimate.subtotalLabor)}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">Total</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {fmt(estimate.total)}
            </span>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          fullWidth
          icon={downloadSuccess ? <Check size={18} /> : <Download size={18} />}
          onClick={handleDownload}
          className={downloadSuccess ? '!bg-green-500 !text-white !shadow-green-500/20' : ''}
        >
          {downloadSuccess ? 'Downloaded!' : 'Download PDF'}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            fullWidth
            icon={sharing ? <Share2 size={18} className="animate-pulse" /> : <MessageSquare size={18} />}
            onClick={handleShareSMS}
            disabled={sharing}
          >
            Share via SMS
          </Button>
          <Button variant="secondary" fullWidth icon={<Mail size={18} />} onClick={handleShareEmail}>
            Share via Email
          </Button>
        </div>
      </div>

      {onClose && (
        <Button variant="ghost" fullWidth onClick={onClose} className="mt-2">
          Close
        </Button>
      )}
    </div>
  );
};
