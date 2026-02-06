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
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const suffix = id.substring(0, 4).toUpperCase();
  return `PP-${yyyy}-${mm}${dd}-${suffix}`;
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
      <div style={{ fontFamily: "'Inter', sans-serif", padding: '80px 20px', textAlign: 'center', color: '#1e293b' }}>
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
  const isExterior = projectType.includes('exterior') || (!isInterior);

  // Compute labor total
  const laborTotal = estimate.labor.reduce((sum, l) => sum + l.painters * l.days * l.hoursPerDay * l.hourlyRate, 0);
  const materialsTotal = estimate.subtotalMaterials || estimate.materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);

  // Customer info
  const custName = estimate.customerName || customer?.firstName + ' ' + customer?.lastName || 'Customer';
  const custAddress = customer ? `${customer.address || ''}` : (estimate.customerAddress || '');
  const custCityLine = customer ? `${customer.city || ''}, ${customer.state || ''} ${customer.zipCode || ''}` : '';
  const custPhone = customer?.phone || '';
  const custEmail = customer?.email || '';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .ep-body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f1f5f9;
          color: #1e293b;
          line-height: 1.5;
        }
        .ep-page {
          max-width: 850px;
          margin: 0 auto;
          background: white;
          padding: 48px 56px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }

        /* === HEADER === */
        .ep-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 3px solid #1e3a5f;
          flex-wrap: wrap;
          gap: 16px;
        }
        .ep-brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ep-logo {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #1e3a5f, #0f172a);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 28px; font-weight: 700;
          flex-shrink: 0;
        }
        .ep-brand-info h1 {
          font-size: 22px; font-weight: 700; color: #0f172a;
          letter-spacing: -0.5px; margin: 0 0 4px 0;
        }
        .ep-brand-info p {
          font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;
        }
        .ep-meta {
          text-align: right;
          flex-shrink: 0;
        }
        .ep-est-num {
          font-size: 14px; font-weight: 600; color: #1e3a5f; margin-bottom: 6px;
        }
        .ep-est-date {
          font-size: 13px; color: #64748b; margin-bottom: 10px;
        }
        .ep-valid-badge {
          display: inline-block;
          padding: 6px 12px;
          background: #f0fdf4; border: 1px solid #86efac; border-radius: 20px;
          font-size: 12px; font-weight: 600; color: #166534;
        }

        /* === CUSTOMER + PROJECT TYPE === */
        .ep-customer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 36px;
        }
        .ep-label {
          font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;
        }
        .ep-cust-name {
          font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 6px;
        }
        .ep-cust-addr {
          font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 12px;
        }
        .ep-contact {
          display: flex; flex-wrap: wrap; gap: 16px;
          font-size: 13px; color: #64748b;
        }
        .ep-contact span { display: flex; align-items: center; gap: 6px; }
        .ep-type-row { display: flex; flex-wrap: wrap; gap: 12px; }
        .ep-type-badge {
          padding: 10px 16px;
          background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px;
          font-size: 13px; font-weight: 500; color: #64748b;
        }
        .ep-type-badge.active {
          background: #eff6ff; border-color: #3b82f6; color: #1e3a5f;
        }
        .ep-type-badge.active::before { content: "✓ "; color: #3b82f6; font-weight: 700; }

        /* === SECTION BLOCKS === */
        .ep-block {
          margin-bottom: 28px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }
        .ep-block-title {
          font-size: 13px; font-weight: 700; color: #1e3a5f;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;
        }
        .ep-overview-box {
          padding: 20px 24px;
          background: #f8fafc; border-radius: 12px;
          margin-bottom: 28px;
        }
        .ep-overview-box .ep-block-title { margin-bottom: 10px; }
        .ep-overview-text {
          font-size: 14px; line-height: 1.8; color: #475569; white-space: pre-wrap;
        }

        /* === PREP CHECKLIST === */
        .ep-checklist {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px;
        }
        .ep-check {
          display: flex; align-items: center; gap: 10px;
          font-size: 14px; color: #475569;
        }
        .ep-check-icon {
          width: 18px; height: 18px; border-radius: 4px;
          background: #3b82f6; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
        }

        /* === MATERIALS TABLE === */
        .ep-mat-table {
          width: 100%; border-collapse: collapse;
        }
        .ep-mat-table th {
          text-align: left; padding: 12px 16px;
          background: #f8fafc; font-size: 11px; font-weight: 700;
          color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
        }
        .ep-mat-table td {
          padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px;
        }
        .ep-mat-table tr:last-child td { border-bottom: none; }
        .ep-mat-name { font-weight: 600; color: #0f172a; }

        /* === COST + LABOR (side by side on desktop, stacked on mobile) === */
        .ep-cost-grid {
          display: grid; grid-template-columns: 1fr 320px; gap: 40px;
          margin-top: 36px; padding-top: 28px; border-top: 2px solid #1e3a5f;
        }
        .ep-cost-row {
          display: flex; justify-content: space-between; padding: 10px 0;
          border-bottom: 1px solid #f1f5f9; font-size: 14px;
        }
        .ep-cost-lbl { color: #64748b; }
        .ep-cost-val { font-weight: 600; color: #0f172a; white-space: nowrap; }
        .ep-cost-total {
          display: flex; justify-content: space-between; padding: 16px 0;
          border-top: 2px solid #1e3a5f; margin-top: 8px;
        }
        .ep-cost-total .ep-cost-lbl {
          font-size: 16px; font-weight: 700; color: #0f172a;
        }
        .ep-cost-total .ep-cost-val {
          font-size: 24px; font-weight: 800; color: #1e3a5f;
        }
        .ep-labor-panel {
          background: #f8fafc; border-radius: 12px; padding: 20px;
        }
        .ep-labor-title {
          font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;
        }
        .ep-labor-row {
          padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;
        }
        .ep-labor-row:last-child { border-bottom: none; }
        .ep-labor-desc { font-weight: 600; color: #0f172a; margin-bottom: 3px; }
        .ep-labor-amt { font-weight: 600; color: #1e3a5f; margin-top: 4px; }

        /* === TERMS, WARRANTY, LEGAL, SIGNATURES === */
        .ep-terms-section {
          margin-top: 40px; padding-top: 28px; border-top: 1px solid #e2e8f0;
        }
        .ep-terms-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px;
        }
        .ep-terms-block h4 {
          font-size: 12px; font-weight: 700; color: #1e3a5f;
          text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;
        }
        .ep-terms-block p {
          font-size: 13px; color: #64748b; line-height: 1.7; margin: 0 0 8px 0;
        }
        .ep-warranty-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px; background: #f0fdf4; border: 1px solid #86efac;
          border-radius: 8px; font-size: 13px; font-weight: 600; color: #166534;
        }

        /* Legal Fine Print */
        .ep-legal {
          margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;
        }
        .ep-legal h4 {
          font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;
        }
        .ep-legal p, .ep-legal li {
          font-size: 11px; color: #94a3b8; line-height: 1.7; margin: 0 0 6px 0;
        }
        .ep-legal ol {
          padding-left: 18px; margin: 0 0 12px 0;
        }

        /* Acceptance / Signature */
        .ep-acceptance {
          margin-top: 32px; padding-top: 24px; border-top: 2px solid #1e3a5f;
        }
        .ep-accept-title {
          font-size: 13px; font-weight: 700; color: #1e3a5f;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;
        }
        .ep-accept-text {
          font-size: 13px; color: #475569; line-height: 1.7; margin-bottom: 24px;
        }
        .ep-sig-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
        }
        .ep-sig-block { }
        .ep-sig-line {
          border-bottom: 1px solid #cbd5e1; margin-bottom: 8px; height: 40px;
        }
        .ep-sig-label {
          font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase;
        }

        /* === FOOTER === */
        .ep-footer {
          margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        .ep-footer-brand {
          font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 6px;
        }
        .ep-footer-certs {
          font-size: 11px; color: #cbd5e1;
        }

        /* === ACTION BUTTONS (non-print) === */
        .ep-actions {
          position: fixed; bottom: 24px; right: 24px;
          display: flex; gap: 8px; z-index: 100;
        }
        .ep-btn {
          padding: 12px 24px; border: none; border-radius: 12px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          transition: transform 0.15s;
        }
        .ep-btn:active { transform: scale(0.97); }
        .ep-btn-print { background: linear-gradient(135deg, #1e3a5f, #0f172a); color: white; }
        .ep-btn-back { background: white; color: #1e3a5f; border: 2px solid #e2e8f0; }

        /* === MOBILE === */
        @media (max-width: 700px) {
          .ep-page { padding: 24px 20px; }
          .ep-header { flex-direction: column; gap: 16px; }
          .ep-meta { text-align: left; }
          .ep-customer-grid { grid-template-columns: 1fr; gap: 24px; }
          .ep-checklist { grid-template-columns: 1fr; }
          .ep-cost-grid { grid-template-columns: 1fr; gap: 24px; }
          .ep-terms-grid { grid-template-columns: 1fr; gap: 24px; }
          .ep-sig-grid { grid-template-columns: 1fr; gap: 24px; }
          .ep-mat-table th, .ep-mat-table td { padding: 10px 8px; font-size: 12px; }
          .ep-cost-total .ep-cost-val { font-size: 20px; }
        }

        /* === PRINT === */
        @media print {
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .ep-body { background: white !important; }
          .ep-page { box-shadow: none; padding: 32px 40px; max-width: none; }
          .ep-actions { display: none !important; }
        }
      `}</style>

      <div className="ep-body">
        <div className="ep-page">

          {/* ============ HEADER ============ */}
          <div className="ep-header">
            <div className="ep-brand">
              <div className="ep-logo">◆</div>
              <div className="ep-brand-info">
                <h1>Pinpoint Painting LLC</h1>
                <p>8001 Sweet Valley Drive, Suite 10<br />Valley View, OH 44125<br />216-524-3365 • pinpointpainting.com</p>
              </div>
            </div>
            <div className="ep-meta">
              <div className="ep-est-num">ESTIMATE #{getEstimateNumber(estimate.id, estimate.createdAt)}</div>
              <div className="ep-est-date">{formatDate(estimate.createdAt)}</div>
              <div className="ep-valid-badge">Valid through {getValidityDate(estimate.createdAt, estimate.expiresAt)}</div>
            </div>
          </div>

          {/* ============ CUSTOMER + PROJECT TYPE ============ */}
          <div className="ep-customer-grid">
            <div>
              <p className="ep-label">Prepared for</p>
              <div className="ep-cust-name">{custName}</div>
              {(custAddress || custCityLine) && (
                <div className="ep-cust-addr">
                  {custAddress}{custCityLine && <><br />{custCityLine}</>}
                </div>
              )}
              <div className="ep-contact">
                {custPhone && <span>📱 {custPhone}</span>}
                {custEmail && <span>✉️ {custEmail}</span>}
              </div>
            </div>
            <div>
              <p className="ep-label">Project Type</p>
              <div className="ep-type-row">
                <span className={`ep-type-badge${isExterior ? ' active' : ''}`}>Exterior</span>
                <span className={`ep-type-badge${isInterior ? ' active' : ''}`}>Interior</span>
              </div>
            </div>
          </div>

          {/* ============ PROJECT OVERVIEW ============ */}
          <div className="ep-overview-box">
            <div className="ep-block-title">Project Overview</div>
            <div className="ep-overview-text">
              {estimate.description || `${estimate.projectName || 'Painting project'} for ${custName}. All surfaces shall receive proper preparation prior to coating application. Includes cleanup and protection of surrounding areas.`}
            </div>
          </div>

          {/* ============ PREPARATION CHECKLIST ============ */}
          <div className="ep-block">
            <div className="ep-block-title">Preparation Work Included</div>
            <div className="ep-checklist">
              {(estimate.scopeOfWork.length > 0 ? estimate.scopeOfWork : [
                'Patch nail holes and stress cracks',
                'Sand patched areas smooth',
                'Caulk gaps in trim and seams',
                'Pressure wash exterior surfaces',
                'Scrape loose/peeling paint',
                'Protect landscaping & surfaces',
                'Prime bare wood where needed',
                'Daily cleanup and final cleanup',
              ]).map((item, i) => (
                <div key={i} className="ep-check">
                  <div className="ep-check-icon">✓</div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ============ MATERIALS / PAINT SPECS ============ */}
          {estimate.materials.length > 0 && (
            <div className="ep-block">
              <div className="ep-block-title">Paint Specifications &amp; Materials</div>
              <table className="ep-mat-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Product</th>
                    <th style={{ width: '15%' }}>Qty</th>
                    <th style={{ width: '20%', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ width: '25%', textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.materials.map((m) => (
                    <tr key={m.id}>
                      <td className="ep-mat-name">{m.name}</td>
                      <td>{m.quantity} {m.unit}{m.quantity !== 1 ? 's' : ''}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(m.unitPrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        {fmt(m.quantity * m.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ============ INVESTMENT SUMMARY + LABOR ============ */}
          <div className="ep-cost-grid">
            <div>
              <div className="ep-block-title">Investment Summary</div>

              {estimate.labor.map((l) => {
                const amt = l.painters * l.days * l.hoursPerDay * l.hourlyRate;
                return (
                  <div key={l.id} className="ep-cost-row">
                    <span className="ep-cost-lbl">
                      Labor ({l.painters} painter{l.painters !== 1 ? 's' : ''} × {l.days} day{l.days !== 1 ? 's' : ''} × ${l.hourlyRate}/hr)
                    </span>
                    <span className="ep-cost-val">{fmt(amt)}</span>
                  </div>
                );
              })}

              {estimate.labor.length === 0 && (
                <div className="ep-cost-row">
                  <span className="ep-cost-lbl">Labor</span>
                  <span className="ep-cost-val">{fmt(laborTotal)}</span>
                </div>
              )}

              <div className="ep-cost-row">
                <span className="ep-cost-lbl">Materials (paint, primer, supplies)</span>
                <span className="ep-cost-val">{materialsTotal > 0 ? fmt(materialsTotal) : 'Included'}</span>
              </div>

              {estimate.markupAmount > 0 && (
                <div className="ep-cost-row">
                  <span className="ep-cost-lbl">Markup ({estimate.materialMarkupPercent || defaultMarkupPercent}%)</span>
                  <span className="ep-cost-val">{fmt(estimate.markupAmount)}</span>
                </div>
              )}

              {estimate.taxAmount > 0 && (
                <div className="ep-cost-row">
                  <span className="ep-cost-lbl">Tax ({estimate.taxRate || defaultTaxRate}%)</span>
                  <span className="ep-cost-val">{fmt(estimate.taxAmount)}</span>
                </div>
              )}

              <div className="ep-cost-row">
                <span className="ep-cost-lbl">Preparation &amp; Cleanup</span>
                <span className="ep-cost-val">Included</span>
              </div>

              <div className="ep-cost-total">
                <span className="ep-cost-lbl">Total Investment</span>
                <span className="ep-cost-val">{fmt(estimate.total)}</span>
              </div>
            </div>

            {/* Labor Breakdown Panel */}
            <div className="ep-labor-panel">
              <div className="ep-labor-title">Labor Breakdown</div>
              {estimate.labor.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>No labor items specified</p>
              ) : (
                estimate.labor.map((l) => (
                  <div key={l.id} className="ep-labor-row">
                    <div className="ep-labor-desc">{l.description}</div>
                    <div>
                      Crew: {l.painters} painter{l.painters !== 1 ? 's' : ''} · {l.days} day{l.days !== 1 ? 's' : ''} · {l.hoursPerDay} hrs/day · {fmt(l.hourlyRate)}/hr
                    </div>
                    <div className="ep-labor-amt">{fmt(l.painters * l.days * l.hoursPerDay * l.hourlyRate)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ============ TERMS & WARRANTY ============ */}
          <div className="ep-terms-section">
            <div className="ep-terms-grid">
              <div className="ep-terms-block">
                <h4>Payment Terms</h4>
                <p>• 50% deposit required to schedule project</p>
                <p>• Remaining balance due upon satisfactory completion</p>
                <p>• Payment accepted: Check, Cash, Credit Card, Zelle</p>
                <p>• Late payments subject to 1.5% monthly finance charge</p>
              </div>
              <div className="ep-terms-block">
                <h4>Warranty &amp; Certifications</h4>
                <span className="ep-warranty-badge">✓ 2-Year Full Warranty</span>
                <p style={{ marginTop: 12 }}>
                  EPA Lead-Safe Certified — NAT-F111764-1<br />
                  Fully Insured &amp; Bonded<br />
                  Ohio Contractor License
                </p>
              </div>
            </div>

            {/* Legal Fine Print */}
            <div className="ep-legal">
              <h4>Terms &amp; Conditions</h4>
              <ol>
                <li>This estimate is valid for 60 days from the date issued. Pricing may change after the expiration date due to material cost fluctuations or changes in project scope.</li>
                <li>Any alteration or deviation from the specifications described above involving additional costs will be executed only upon written change order, and will become an additional charge over and above this estimate.</li>
                <li>Owner is responsible for removal of furniture, wall hangings, and personal items from work areas prior to start date. Pinpoint Painting LLC is not responsible for damage to items left in work areas.</li>
                <li>Pinpoint Painting LLC warrants all workmanship for a period of two (2) years from the date of project completion. This warranty covers peeling, blistering, or flaking caused by improper application. It does not cover damage due to settling, structural movement, moisture intrusion, or abuse.</li>
                <li>Pinpoint Painting LLC maintains general liability insurance and workers' compensation coverage for all employees. Proof of insurance available upon request.</li>
                <li>In the event of inclement weather (exterior projects), the project timeline may be extended at no additional cost. The contractor will communicate schedule changes promptly.</li>
                <li>Colors may vary slightly from swatches and digital representations due to surface texture, lighting conditions, and application method. A test patch is recommended for color-critical selections.</li>
                <li>Cancellation within 48 hours of scheduled start date may result in a restocking fee for purchased materials.</li>
              </ol>
            </div>
          </div>

          {/* ============ ACCEPTANCE / SIGNATURES ============ */}
          <div className="ep-acceptance">
            <div className="ep-accept-title">Acceptance</div>
            <div className="ep-accept-text">
              By signing below, the customer acknowledges they have reviewed and accept the scope of work, pricing, and terms described in this estimate. Signing authorizes Pinpoint Painting LLC to proceed with the described work upon receipt of the deposit.
            </div>
            <div className="ep-sig-grid">
              <div className="ep-sig-block">
                <div className="ep-sig-line" />
                <div className="ep-sig-label">Customer Signature &amp; Date</div>
              </div>
              <div className="ep-sig-block">
                <div className="ep-sig-line" />
                <div className="ep-sig-label">Pinpoint Painting LLC — Authorized Representative</div>
              </div>
            </div>
          </div>

          {/* ============ FOOTER ============ */}
          <div className="ep-footer">
            <div className="ep-footer-brand">
              ◆ Pinpoint Painting LLC • 8001 Sweet Valley Drive, Suite 10 • Valley View, OH 44125
            </div>
            <div className="ep-footer-certs">
              216-524-3365 • pinpointpainting.com • EPA Lead-Safe Certified NAT-F111764-1 • Insured &amp; Bonded
            </div>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="ep-actions">
          <button className="ep-btn ep-btn-back" onClick={() => navigate(`/estimates/${id}`)}>
            ← Back
          </button>
          <button className="ep-btn ep-btn-print" onClick={() => window.print()}>
            🖨️ Print / PDF
          </button>
        </div>
      </div>
    </>
  );
};
