import type { Estimate } from '../stores/estimateStore';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

/**
 * Build a plain-text summary of the estimate for sharing
 */
export function buildEstimateSummary(estimate: Estimate): string {
  const lines: string[] = [
    `📋 Estimate from Pinpoint Painting`,
    ``,
    `Project: ${estimate.projectName}`,
    `Customer: ${estimate.customerName}`,
    `Address: ${estimate.customerAddress}`,
    ``,
  ];

  if (estimate.scopeOfWork.length > 0) {
    lines.push(`Scope of Work:`);
    estimate.scopeOfWork.forEach((item) => lines.push(`  • ${item}`));
    lines.push(``);
  }

  if (estimate.description) {
    lines.push(`Description: ${estimate.description}`);
    lines.push(``);
  }

  lines.push(`Materials: ${fmt(estimate.subtotalMaterials)}`);
  if (estimate.markupAmount > 0) {
    lines.push(`Markup (${estimate.materialMarkupPercent}%): ${fmt(estimate.markupAmount)}`);
  }
  lines.push(`Labor: ${fmt(estimate.subtotalLabor)}`);
  if (estimate.taxAmount > 0) {
    lines.push(`Tax (${estimate.taxRate}%): ${fmt(estimate.taxAmount)}`);
  }
  lines.push(``);
  lines.push(`💰 Total: ${fmt(estimate.total)}`);
  lines.push(``);
  lines.push(`Status: ${estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}`);

  return lines.join('\n');
}

/**
 * Build an HTML email body for the estimate
 */
function buildEstimateEmailBody(estimate: Estimate): string {
  let body = `Estimate from Pinpoint Painting\n\n`;
  body += `Project: ${estimate.projectName}\n`;
  body += `Customer: ${estimate.customerName}\n`;
  body += `Address: ${estimate.customerAddress}\n\n`;

  if (estimate.description) {
    body += `Description: ${estimate.description}\n\n`;
  }

  if (estimate.materials.length > 0) {
    body += `Materials:\n`;
    estimate.materials.forEach((m) => {
      body += `  - ${m.name}: ${m.quantity} ${m.unit} × ${fmt(m.unitPrice)} = ${fmt(m.quantity * m.unitPrice)}\n`;
    });
    body += `  Subtotal: ${fmt(estimate.subtotalMaterials)}\n`;
    if (estimate.markupAmount > 0) {
      body += `  Markup (${estimate.materialMarkupPercent}%): ${fmt(estimate.markupAmount)}\n`;
    }
    body += `\n`;
  }

  if (estimate.labor.length > 0) {
    body += `Labor:\n`;
    estimate.labor.forEach((l) => {
      const total = l.painters * l.days * l.hoursPerDay * l.hourlyRate;
      body += `  - ${l.description}: ${l.painters} painters × ${l.days} days × ${l.hoursPerDay} hrs @ $${l.hourlyRate}/hr = ${fmt(total)}\n`;
    });
    body += `  Subtotal: ${fmt(estimate.subtotalLabor)}\n\n`;
  }

  if (estimate.taxAmount > 0) {
    body += `Tax (${estimate.taxRate}%): ${fmt(estimate.taxAmount)}\n`;
  }

  body += `\nTOTAL: ${fmt(estimate.total)}\n`;
  body += `\n---\nSent via Pinpoint Painting`;

  return body;
}

/**
 * Share via SMS — uses Web Share API if available, falls back to sms: link
 */
export async function shareViaSMS(estimate: Estimate): Promise<boolean> {
  const message = buildEstimateSummary(estimate);

  // Try Web Share API first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Estimate - ${estimate.projectName}`,
        text: message,
      });
      return true;
    } catch (err) {
      // User cancelled or API failed — fall through to sms: link
      if ((err as DOMException)?.name === 'AbortError') return false;
    }
  }

  // Fallback: open SMS link
  const encoded = encodeURIComponent(message);
  window.open(`sms:?body=${encoded}`, '_blank');
  return true;
}

/**
 * Share via Email — opens mailto: link with formatted estimate
 */
export function shareViaEmail(estimate: Estimate): boolean {
  const subject = encodeURIComponent(`Painting Estimate - ${estimate.projectName}`);
  const body = encodeURIComponent(buildEstimateEmailBody(estimate));
  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  return true;
}

/**
 * Copy estimate summary to clipboard
 */
export async function copyEstimateToClipboard(estimate: Estimate): Promise<boolean> {
  const text = buildEstimateSummary(estimate);

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
