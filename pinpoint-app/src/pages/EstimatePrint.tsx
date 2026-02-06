import { useParams, useNavigate } from 'react-router-dom';
import { useEstimateStore } from '../stores/estimateStore';
import { useCustomerStore } from '../stores/customerStore';
import { useBusinessConfigStore } from '../stores/businessConfigStore';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const getValidityDate = (createdAt: string, expiresAt?: string) => {
  if (expiresAt) return formatDate(expiresAt);
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 60);
  return formatDate(d.toISOString());
};

const getEstimateNumber = (id: string, createdAt: string) => {
  const d = new Date(createdAt);
  const yyyy = d.getFullYear();
  const suffix = id.substring(0, 4).toUpperCase();
  return `PP-${yyyy}-${suffix}`;
};

export const EstimatePrint = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { estimates } = useEstimateStore();
  const { getCustomer } = useCustomerStore();
  const { defaultMarkupPercent, defaultTaxRate } = useBusinessConfigStore();

  const estimate = estimates.find((e) => e.id === id);
  const customer = estimate ? getCustomer(estimate.customerId) : undefined;

  if (!estimate) {
    return (
      <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", padding: '80px 20px', textAlign: 'center', color: '#1e293b' }}>
        <h2>Estimate not found</h2>
        <p style={{ color: '#64748b', marginTop: 8 }}>This estimate may have been deleted or the link is invalid.</p>
        <button
          onClick={() => navigate('/estimates')}
          style={{ marginTop: 24, padding: '10px 24px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Back to Estimates
        </button>
      </div>
    );
  }

  const projectType = estimate.projectName?.toLowerCase() || '';
  const isInterior = projectType.includes('interior');
  const isExterior = projectType.includes('exterior');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f1f5f9;
          padding: 40px 20px;
          color: #1e293b;
        }
        .ep-page {
          max-width: 850px;
          margin: 0 auto;
          background: white;
          padding: 48px 56px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .ep-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 3px solid #1e3a5f;
        }
        .ep-brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ep-logo {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #1e3a5f, #0f172a);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          font-weight: 700;
        }
        .ep-brand-info h1 {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        .ep-brand-info p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
        }
        .ep-estimate-meta {
          text-align: right;
        }
        .ep-estimate-number {
          font-size: 14px;
          font-weight: 600;
          color: #1e3a5f;
          margin-bottom: 8px;
        }
        .ep-estimate-date {
          font-size: 13px;
          color: #64748b;
        }
        .ep-valid-badge {
          display: inline-block;
          margin-top: 12px;
          padding: 6px 12px;
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #166534;
        }
        .ep-customer-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          margin-bottom: 40px;
        }
        .ep-section-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .ep-customer-name {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .ep-customer-address {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .ep-contact-row {
          display: flex;
          gap: 20px;
          font-size: 13px;
          color: #64748b;
        }
        .ep-contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ep-project-type {
          display: inline-flex;
          gap: 16px;
        }
        .ep-type-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }
        .ep-type-badge.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1e3a5f;
        }
        .ep-type-badge.active::before {
          content: "✓";
          color: #3b82f6;
          font-weight: 700;
        }
        .ep-section-block {
          margin-bottom: 32px;
          padding: 24px 0;
          border-top: 1px solid #e2e8f0;
        }
        .ep-section-title {
          font-size: 13px;
          font-weight: 700;
          color: #1e3a5f;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 20px;
        }
        .ep-section-content {
          font-size: 14px;
          line-height: 1.8;
          color: #475569;
        }
        .ep-checklist {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px 32px;
        }
        .ep-check-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #475569;
        }
        .ep-check-box {
          width: 18px;
          height: 18px;
          border: 2px solid #3b82f6;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 700;
          background: #3b82f6;
          flex-shrink: 0;
        }
        .ep-materials-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        .ep-materials-table th {
          text-align: left;
          padding: 12px 16px;
          background: #f8fafc;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
        }
        .ep-materials-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }
        .ep-materials-table tr:last-child td {
          border-bottom: none;
        }
        .ep-area-name { font-weight: 600; color: #0f172a; }
        .ep-cost-section {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 48px;
          margin-top: 40px;
          padding-top: 32px;
          border-top: 2px solid #1e3a5f;
        }
        .ep-cost-details {
          font-size: 14px;
        }
        .ep-cost-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .ep-cost-row.total {
          padding: 16px 0;
          border-top: 2px solid #1e3a5f;
          border-bottom: none;
          margin-top: 8px;
        }
        .ep-cost-label {
          color: #64748b;
        }
        .ep-cost-value {
          font-weight: 600;
          color: #0f172a;
        }
        .ep-cost-row.total .ep-cost-label {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }
        .ep-cost-row.total .ep-cost-value {
          font-size: 24px;
          font-weight: 800;
          color: #1e3a5f;
        }
        .ep-labor-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
        }
        .ep-labor-title {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }
        .ep-labor-item {
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          color: #475569;
        }
        .ep-labor-item:last-child {
          border-bottom: none;
        }
        .ep-labor-desc {
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .ep-terms-section {
          margin-top: 40px;
          padding-top: 32px;
          border-top: 1px solid #e2e8f0;
        }
        .ep-terms-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        .ep-terms-block h4 {
          font-size: 12px;
          font-weight: 700;
          color: #1e3a5f;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ep-terms-block p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.7;
          margin-bottom: 10px;
        }
        .ep-warranty-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #166534;
        }
        .ep-footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ep-footer-brand {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
        }
        .ep-action-buttons {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          gap: 8px;
          z-index: 100;
        }
        .ep-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .ep-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.2);
        }
        .ep-btn:active {
          transform: scale(0.97);
        }
        .ep-btn-print {
          background: linear-gradient(135deg, #1e3a5f, #0f172a);
          color: white;
        }
        .ep-btn-back {
          background: white;
          color: #1e3a5f;
          border: 2px solid #e2e8f0;
        }
        @media print {
          body { background: white; padding: 0; }
          .ep-page { box-shadow: none; padding: 32px 40px; }
          .ep-action-buttons { display: none !important; }
        }
      `}</style>

      <div className="ep-page">
        {/* Header */}
        <div className="ep-header">
          <div className="ep-brand">
            <div className="ep-logo">◆</div>
            <div className="ep-brand-info">
              <h1>Pinpoint Painting LLC</h1>
              <p>8001 Sweet Valley Drive, Suite 10<br />Valley View, OH 44125</p>
            </div>
          </div>
          <div className="ep-estimate-meta">
            <div className="ep-estimate-number">ESTIMATE #{getEstimateNumber(estimate.id, estimate.createdAt)}</div>
            <div className="ep-estimate-date">{formatDate(estimate.createdAt)}</div>
            <div className="ep-valid-badge">Valid through {getValidityDate(estimate.createdAt, estimate.expiresAt)}</div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="ep-customer-section">
          <div>
            <p className="ep-section-label">Prepared for</p>
            <h2 className="ep-customer-name">{estimate.customerName}</h2>
            <p className="ep-customer-address">
              {customer ? (
                <>
                  {customer.address}<br />
                  {customer.city}, {customer.state} {customer.zipCode}
                </>
              ) : (
                estimate.customerAddress
              )}
            </p>
            <div className="ep-contact-row">
              {customer?.phone && (
                <span className="ep-contact-item">📱 {customer.phone}</span>
              )}
              {customer?.email && (
                <span className="ep-contact-item">✉️ {customer.email}</span>
              )}
            </div>
          </div>
          <div>
            <p className="ep-section-label">Project type</p>
            <div className="ep-project-type">
              <span className={`ep-type-badge${isExterior ? ' active' : ''}`}>Exterior</span>
              <span className={`ep-type-badge${isInterior ? ' active' : ''}`}>Interior</span>
            </div>
          </div>
        </div>

        {/* Project Overview */}
        {estimate.description && (
          <div className="ep-section-block" style={{ padding: 24, background: '#f8fafc', borderRadius: 12, border: 'none' }}>
            <p className="ep-section-title" style={{ marginBottom: 12 }}>Project Overview</p>
            <p className="ep-section-content" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {estimate.description}
            </p>
          </div>
        )}

        {/* Preparation Checklist */}
        {estimate.scopeOfWork.length > 0 && (
          <div className="ep-section-block">
            <p className="ep-section-title">Preparation Work Included</p>
            <div className="ep-checklist">
              {estimate.scopeOfWork.map((item, i) => (
                <div key={i} className="ep-check-item">
                  <div className="ep-check-box">✓</div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Materials / Paint Specifications */}
        {estimate.materials.length > 0 && (
          <div className="ep-section-block">
            <p className="ep-section-title">Materials &amp; Paint Specifications</p>
            <table className="ep-materials-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Product</th>
                  <th style={{ width: '15%' }}>Quantity</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ width: '25%', textAlign: 'right' }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.materials.map((material) => (
                  <tr key={material.id}>
                    <td className="ep-area-name">{material.name}</td>
                    <td>{material.quantity} {material.unit}{material.quantity !== 1 ? 's' : ''}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(material.unitPrice)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      {fmt(material.quantity * material.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cost Summary + Labor */}
        <div className="ep-cost-section">
          <div className="ep-cost-details">
            <p className="ep-section-title">Investment Summary</p>

            {/* Labor line items */}
            {estimate.labor.map((l) => {
              const laborTotal = l.painters * l.days * l.hoursPerDay * l.hourlyRate;
              return (
                <div key={l.id} className="ep-cost-row">
                  <span className="ep-cost-label">
                    {l.description} ({l.painters} painter{l.painters !== 1 ? 's' : ''} × {l.days} day{l.days !== 1 ? 's' : ''} × {l.hoursPerDay}hrs × {fmt(l.hourlyRate)}/hr)
                  </span>
                  <span className="ep-cost-value">{fmt(laborTotal)}</span>
                </div>
              );
            })}

            {estimate.labor.length > 1 && (
              <div className="ep-cost-row">
                <span className="ep-cost-label">Labor Subtotal</span>
                <span className="ep-cost-value">{fmt(estimate.subtotalLabor)}</span>
              </div>
            )}

            <div className="ep-cost-row">
              <span className="ep-cost-label">Materials</span>
              <span className="ep-cost-value">{fmt(estimate.subtotalMaterials)}</span>
            </div>

            {estimate.markupAmount > 0 && (
              <div className="ep-cost-row">
                <span className="ep-cost-label">Markup ({estimate.materialMarkupPercent || defaultMarkupPercent}%)</span>
                <span className="ep-cost-value">{fmt(estimate.markupAmount)}</span>
              </div>
            )}

            {estimate.taxAmount > 0 && (
              <div className="ep-cost-row">
                <span className="ep-cost-label">Tax ({estimate.taxRate || defaultTaxRate}%)</span>
                <span className="ep-cost-value">{fmt(estimate.taxAmount)}</span>
              </div>
            )}

            <div className="ep-cost-row">
              <span className="ep-cost-label">Preparation &amp; Cleanup</span>
              <span className="ep-cost-value">Included</span>
            </div>

            <div className="ep-cost-row total">
              <span className="ep-cost-label">Total Investment</span>
              <span className="ep-cost-value">{fmt(estimate.total)}</span>
            </div>
          </div>

          {/* Labor Breakdown Panel */}
          <div className="ep-labor-section">
            <p className="ep-labor-title">Labor Breakdown</p>
            {estimate.labor.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8' }}>No labor items</p>
            ) : (
              estimate.labor.map((l) => (
                <div key={l.id} className="ep-labor-item">
                  <div className="ep-labor-desc">{l.description}</div>
                  <div>
                    Crew: {l.painters} painter{l.painters !== 1 ? 's' : ''} &middot;{' '}
                    {l.days} day{l.days !== 1 ? 's' : ''} &middot;{' '}
                    {l.hoursPerDay} hrs/day &middot;{' '}
                    {fmt(l.hourlyRate)}/hr
                  </div>
                  <div style={{ fontWeight: 600, color: '#1e3a5f', marginTop: 4 }}>
                    {fmt(l.painters * l.days * l.hoursPerDay * l.hourlyRate)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Terms & Warranty */}
        <div className="ep-terms-section">
          <div className="ep-terms-grid">
            <div className="ep-terms-block">
              <h4>Payment Terms</h4>
              <p>• 50% deposit required to schedule</p>
              <p>• Balance due upon completion</p>
              <p>• Accepting: Check, Cash, Credit Card</p>
            </div>
            <div className="ep-terms-block">
              <h4>Warranty &amp; Certifications</h4>
              <span className="ep-warranty-badge">✓ 2-Year Full Warranty</span>
              <p style={{ marginTop: 12 }}>EPA Lead-Safe Certified<br />NAT-F111764-1 | Insured &amp; Bonded</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ep-footer">
          <div className="ep-footer-brand">
            ◆ Pinpoint Painting LLC • 216-524-3365 • pinpointpainting.com
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="ep-action-buttons">
        <button className="ep-btn ep-btn-back" onClick={() => navigate(`/estimates/${id}`)}>
          ← Back
        </button>
        <button className="ep-btn ep-btn-print" onClick={() => window.print()}>
          🖨️ Print
        </button>
      </div>
    </>
  );
};
