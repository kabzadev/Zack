import jsPDF from 'jspdf';
import type { Estimate, MaterialItem, LaborItem } from '../stores/estimateStore';
import type { Customer } from '../stores/customerStore';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const COLORS = {
  navy: [15, 23, 42] as [number, number, number],
  darkSlate: [30, 41, 59] as [number, number, number],
  slate: [71, 85, 105] as [number, number, number],
  lightSlate: [148, 163, 184] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  accent: [59, 130, 246] as [number, number, number],
  accentLight: [219, 234, 254] as [number, number, number],
  divider: [226, 232, 240] as [number, number, number],
  tableHeader: [241, 245, 249] as [number, number, number],
  tableRowAlt: [248, 250, 252] as [number, number, number],
};

function drawHeader(doc: jsPDF, pageWidth: number): number {
  // Navy header band
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 44, 'F');

  // Accent stripe
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 44, pageWidth, 3, 'F');

  // Diamond logo
  doc.setFillColor(...COLORS.white);
  const cx = 24;
  const cy = 22;
  const r = 10;
  // Draw diamond shape using triangles
  doc.triangle(cx, cy - r, cx + r, cy, cx, cy + r, 'F');
  doc.triangle(cx, cy - r, cx - r, cy, cx, cy + r, 'F');

  // Inner diamond accent
  doc.setFillColor(...COLORS.accent);
  const ri = 4;
  doc.triangle(cx, cy - ri, cx + ri, cy, cx, cy + ri, 'F');
  doc.triangle(cx, cy - ri, cx - ri, cy, cx, cy + ri, 'F');

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.white);
  doc.text('PINPOINT', 40, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('PAINTING', 40, 32);

  // "ESTIMATE" label right-aligned
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ESTIMATE', pageWidth - 15, 28, { align: 'right' });

  return 52; // Y position after header
}

function drawCustomerAndProjectInfo(
  doc: jsPDF,
  estimate: Estimate,
  customer: Customer,
  startY: number,
  pageWidth: number,
  margin: number
): number {
  let y = startY;

  const contentWidth = pageWidth - margin * 2;
  const colWidth = contentWidth / 2;

  // Left column: Customer Info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text('CUSTOMER', margin, y);

  // Right column: Project Info
  doc.text('PROJECT DETAILS', margin + colWidth + 10, y);

  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.navy);
  const customerName = `${customer.firstName} ${customer.lastName}`;
  doc.text(customerName, margin, y);

  doc.text(estimate.projectName, margin + colWidth + 10, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate);

  // Customer details
  if (customer.phone) {
    doc.text(customer.phone, margin, y);
    y += 4;
  }
  if (customer.email) {
    doc.text(customer.email, margin, y);
    y += 4;
  }
  const fullAddress = `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`;
  const addressLines = doc.splitTextToSize(fullAddress, colWidth - 5);
  doc.text(addressLines, margin, y);

  // Project details (right column)
  let ry = startY + 11;
  doc.setTextColor(...COLORS.slate);
  doc.setFontSize(9);

  const date = new Date(estimate.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Date: ${date}`, margin + colWidth + 10, ry);
  ry += 4;
  doc.text(`Estimate #: ${estimate.id.toUpperCase()}`, margin + colWidth + 10, ry);
  ry += 4;

  const statusLabel = estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1);
  doc.text(`Status: ${statusLabel}`, margin + colWidth + 10, ry);
  ry += 4;

  if (estimate.expiresAt) {
    const expDate = new Date(estimate.expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Valid Until: ${expDate}`, margin + colWidth + 10, ry);
  }

  const bottomY = Math.max(y + addressLines.length * 4, ry + 2);

  // Divider line
  doc.setDrawColor(...COLORS.divider);
  doc.setLineWidth(0.5);
  doc.line(margin, bottomY + 2, pageWidth - margin, bottomY + 2);

  return bottomY + 8;
}

function drawScopeOfWork(
  doc: jsPDF,
  estimate: Estimate,
  startY: number,
  pageWidth: number,
  margin: number
): number {
  if (!estimate.description && estimate.scopeOfWork.length === 0) return startY;

  let y = startY;
  const contentWidth = pageWidth - margin * 2;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text('SCOPE OF WORK', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkSlate);

  if (estimate.description) {
    const descLines = doc.splitTextToSize(estimate.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 4 + 2;
  }

  estimate.scopeOfWork.forEach((item) => {
    doc.setTextColor(...COLORS.accent);
    doc.text('●', margin + 2, y);
    doc.setTextColor(...COLORS.darkSlate);
    const itemLines = doc.splitTextToSize(item, contentWidth - 10);
    doc.text(itemLines, margin + 8, y);
    y += itemLines.length * 4 + 1;
  });

  doc.setDrawColor(...COLORS.divider);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);

  return y + 8;
}

function drawMaterialsTable(
  doc: jsPDF,
  materials: MaterialItem[],
  startY: number,
  pageWidth: number,
  margin: number
): number {
  if (materials.length === 0) return startY;

  let y = startY;
  const contentWidth = pageWidth - margin * 2;

  // Section title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text('MATERIALS', margin, y);
  y += 6;

  // Table header
  const cols = {
    name: margin,
    qty: margin + contentWidth * 0.45,
    unit: margin + contentWidth * 0.55,
    unitPrice: margin + contentWidth * 0.7,
    total: margin + contentWidth * 0.85,
  };

  doc.setFillColor(...COLORS.navy);
  doc.roundedRect(margin, y - 3.5, contentWidth, 7, 1, 1, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Item', cols.name + 3, y);
  doc.text('Qty', cols.qty, y, { align: 'center' });
  doc.text('Unit', cols.unit, y, { align: 'center' });
  doc.text('Unit Price', cols.unitPrice, y, { align: 'right' });
  doc.text('Total', cols.total + contentWidth * 0.15, y, { align: 'right' });
  y += 6;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  materials.forEach((mat, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.tableRowAlt);
      doc.rect(margin, y - 3.5, contentWidth, 7, 'F');
    }

    doc.setTextColor(...COLORS.darkSlate);
    const nameText = doc.splitTextToSize(mat.name, contentWidth * 0.4);
    doc.text(nameText[0], cols.name + 3, y);
    doc.text(String(mat.quantity), cols.qty, y, { align: 'center' });
    doc.text(mat.unit, cols.unit, y, { align: 'center' });
    doc.text(fmt(mat.unitPrice), cols.unitPrice, y, { align: 'right' });

    const total = mat.quantity * mat.unitPrice;
    doc.setFont('helvetica', 'bold');
    doc.text(fmt(total), cols.total + contentWidth * 0.15, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 7;
  });

  return y + 2;
}

function drawLaborTable(
  doc: jsPDF,
  labor: LaborItem[],
  startY: number,
  pageWidth: number,
  margin: number
): number {
  if (labor.length === 0) return startY;

  let y = startY;
  const contentWidth = pageWidth - margin * 2;

  // Section title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text('LABOR', margin, y);
  y += 6;

  // Table header
  const cols = {
    desc: margin,
    crew: margin + contentWidth * 0.40,
    hours: margin + contentWidth * 0.55,
    rate: margin + contentWidth * 0.70,
    total: margin + contentWidth * 0.85,
  };

  doc.setFillColor(...COLORS.navy);
  doc.roundedRect(margin, y - 3.5, contentWidth, 7, 1, 1, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Description', cols.desc + 3, y);
  doc.text('Crew', cols.crew, y, { align: 'center' });
  doc.text('Hours', cols.hours, y, { align: 'center' });
  doc.text('Rate', cols.rate, y, { align: 'right' });
  doc.text('Total', cols.total + contentWidth * 0.15, y, { align: 'right' });
  y += 6;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  labor.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.tableRowAlt);
      doc.rect(margin, y - 3.5, contentWidth, 7, 'F');
    }

    doc.setTextColor(...COLORS.darkSlate);
    const descText = doc.splitTextToSize(item.description, contentWidth * 0.35);
    doc.text(descText[0], cols.desc + 3, y);

    const totalHours = item.painters * item.days * item.hoursPerDay;
    doc.text(`${item.painters}`, cols.crew, y, { align: 'center' });
    doc.text(`${totalHours}`, cols.hours, y, { align: 'center' });
    doc.text(fmt(item.hourlyRate), cols.rate, y, { align: 'right' });

    const total = totalHours * item.hourlyRate;
    doc.setFont('helvetica', 'bold');
    doc.text(fmt(total), cols.total + contentWidth * 0.15, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 7;
  });

  return y + 2;
}

function drawTotals(
  doc: jsPDF,
  estimate: Estimate,
  startY: number,
  pageWidth: number,
  margin: number
): number {
  let y = startY + 4;
  const contentWidth = pageWidth - margin * 2;
  const rightX = pageWidth - margin;
  const labelX = rightX - contentWidth * 0.35;

  // Totals box background
  const boxHeight = estimate.materialMarkupPercent > 0 ? 46 : 40;
  doc.setFillColor(...COLORS.tableRowAlt);
  doc.roundedRect(labelX - 5, y - 5, rightX - labelX + 10, boxHeight, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate);

  // Materials subtotal
  doc.text('Materials Subtotal', labelX, y);
  doc.text(fmt(estimate.subtotalMaterials), rightX, y, { align: 'right' });
  y += 6;

  // Markup
  if (estimate.materialMarkupPercent > 0) {
    doc.text(`Markup (${estimate.materialMarkupPercent}%)`, labelX, y);
    doc.text(fmt(estimate.markupAmount), rightX, y, { align: 'right' });
    y += 6;
  }

  // Tax
  doc.text(`Tax (${estimate.taxRate}%)`, labelX, y);
  doc.text(fmt(estimate.taxAmount), rightX, y, { align: 'right' });
  y += 6;

  // Labor subtotal
  doc.text('Labor Subtotal', labelX, y);
  doc.text(fmt(estimate.subtotalLabor), rightX, y, { align: 'right' });
  y += 3;

  // Divider
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(1);
  doc.line(labelX, y, rightX, y);
  y += 6;

  // Grand total
  doc.setFillColor(...COLORS.navy);
  doc.roundedRect(labelX - 5, y - 5, rightX - labelX + 10, 12, 2, 2, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('TOTAL', labelX, y + 2);
  doc.text(fmt(estimate.total), rightX, y + 2, { align: 'right' });
  y += 14;

  return y;
}

function drawNotesSection(
  doc: jsPDF,
  _estimate: Estimate,
  startY: number,
  pageWidth: number,
  margin: number
): number {
  let y = startY + 4;
  const contentWidth = pageWidth - margin * 2;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text('NOTES', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.slate);

  const notes = [
    'This estimate is valid for 30 days from the date of issue.',
    'A 50% deposit is required to schedule work.',
    'Final payment is due upon completion.',
    'All work includes proper surface preparation.',
    'Colors may vary slightly from samples.',
  ];

  notes.forEach((note) => {
    const lines = doc.splitTextToSize(`• ${note}`, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4;
  });

  return y;
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number): void {
  const footerY = pageHeight - 12;

  // Footer stripe
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, footerY - 2, pageWidth, 1, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.lightSlate);
  doc.text('Generated by Pinpoint Painting', pageWidth / 2, footerY + 4, { align: 'center' });
  doc.text(
    `© ${new Date().getFullYear()} Pinpoint Painting — Professional Painting Services`,
    pageWidth / 2,
    footerY + 8,
    { align: 'center' }
  );
}

export function generateEstimatePDF(estimate: Estimate, customer: Customer): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  let y = drawHeader(doc, pageWidth);
  y = drawCustomerAndProjectInfo(doc, estimate, customer, y, pageWidth, margin);
  y = drawScopeOfWork(doc, estimate, y, pageWidth, margin);

  // Check if we need a page break before materials
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  y = drawMaterialsTable(doc, estimate.materials, y, pageWidth, margin);

  // Check if we need a page break before labor
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  y = drawLaborTable(doc, estimate.labor, y, pageWidth, margin);

  // Check if we need a page break before totals
  if (y > pageHeight - 70) {
    doc.addPage();
    y = 20;
  }

  y = drawTotals(doc, estimate, y, pageWidth, margin);

  // Check if we need a page break before notes
  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  }

  drawNotesSection(doc, estimate, y, pageWidth, margin);

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, pageWidth, pageHeight);
  }

  return doc;
}

export function downloadEstimatePDF(estimate: Estimate, customer: Customer): void {
  const doc = generateEstimatePDF(estimate, customer);
  const safeName = estimate.projectName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Pinpoint_Estimate_${safeName}_${estimate.id}.pdf`);
}

export function getEstimatePDFBlob(estimate: Estimate, customer: Customer): Blob {
  const doc = generateEstimatePDF(estimate, customer);
  return doc.output('blob');
}
