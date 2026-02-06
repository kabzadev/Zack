import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimateStore } from '../stores/estimateStore';
import { useVoiceDraftStore } from '../stores/voiceDraftStore';
import { Layout, Card, Badge, EmptyState, Modal } from '../components';
import { Plus, Mic, Trash2, ChevronRight } from 'lucide-react';

type EstimateStatusFilter = 'all' | 'draft' | 'sent' | 'approved' | 'rejected';

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

export const EstimateList = () => {
  const navigate = useNavigate();
  const { estimates, deleteEstimate } = useEstimateStore();
  const voiceDraftStore = useVoiceDraftStore();
  const incompleteDrafts = voiceDraftStore.getIncompleteDrafts();

  const [statusFilter, setStatusFilter] = useState<EstimateStatusFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteDraftTarget, setDeleteDraftTarget] = useState<{ id: string; name: string } | null>(null);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: estimates.length, draft: 0, sent: 0, approved: 0, rejected: 0 };
    estimates.forEach(e => { counts[e.status] = (counts[e.status] || 0) + 1; });
    return counts;
  }, [estimates]);

  // Summary stats
  const totalValue = useMemo(() => estimates.reduce((sum, e) => sum + e.total, 0), [estimates]);
  const pendingValue = useMemo(() => estimates.filter(e => e.status === 'sent').reduce((sum, e) => sum + e.total, 0), [estimates]);
  const approvedValue = useMemo(() => estimates.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.total, 0), [estimates]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return estimates;
    return estimates.filter(est => est.status === statusFilter);
  }, [estimates, statusFilter]);

  const sortedEstimates = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filtered]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const fmtFull = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleDelete = useCallback(() => {
    if (deleteTarget) {
      deleteEstimate(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteEstimate]);

  const handleDeleteDraft = useCallback(() => {
    if (deleteDraftTarget) {
      voiceDraftStore.deleteDraft(deleteDraftTarget.id);
      setDeleteDraftTarget(null);
    }
  }, [deleteDraftTarget, voiceDraftStore]);

  const statusTabs: { value: EstimateStatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <Layout activeTab="estimates">
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-2xl font-bold text-white mb-1">Estimates</h1>
        <p className="text-slate-400 text-sm">{estimates.length} total estimates</p>
      </div>

      {/* Summary Cards */}
      {estimates.length > 0 && (
        <div className="px-5 pb-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900/60 rounded-xl p-3 text-center border border-slate-800/50">
              <p className="text-lg font-bold text-white">{fmt(totalValue)}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Total</p>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-3 text-center border border-blue-500/20">
              <p className="text-lg font-bold text-blue-400">{fmt(pendingValue)}</p>
              <p className="text-[10px] text-blue-400/60 uppercase font-semibold tracking-wider">Pending</p>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
              <p className="text-lg font-bold text-emerald-400">{fmt(approvedValue)}</p>
              <p className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider">Approved</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs with Counts */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {statusTabs.map(tab => {
            const count = statusCounts[tab.value] || 0;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.value
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    statusFilter === tab.value ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Drafts In Progress */}
      {incompleteDrafts.length > 0 && statusFilter === 'all' && (
        <div className="px-5 pb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Mic size={12} /> Voice Drafts In Progress
          </p>
          <div className="space-y-2">
            {incompleteDrafts.map((draft) => {
              const pct = voiceDraftStore.getCompletionPercent(draft.id);
              return (
                <Card key={draft.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('/voice-estimate')}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-base truncate">
                          {draft.customerName || 'Unnamed Estimate'}
                        </h3>
                        <Badge variant="warning" size="sm">{pct}% done</Badge>
                      </div>
                      {draft.propertyAddress && (
                        <p className="text-sm text-slate-400 mb-1 truncate">{draft.propertyAddress}</p>
                      )}
                      <p className="text-xs text-slate-500">{draft.conversationHistory.length} voice messages</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {draft.estimateTotal != null && draft.estimateTotal > 0 && (
                        <p className="text-lg font-bold text-white">{fmt(draft.estimateTotal)}</p>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteDraftTarget({ id: draft.id, name: draft.customerName || 'Unnamed' }); }}
                        className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${pct}%` }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Estimate List */}
      <div className="px-5 py-4 pb-28">
        {sortedEstimates.length === 0 ? (
          incompleteDrafts.length > 0 && statusFilter === 'all' ? null : (
          <EmptyState
            icon="📊"
            title={estimates.length === 0 ? 'No estimates yet' : 'No estimates found'}
            description={
              estimates.length === 0
                ? 'Create your first estimate to get started'
                : `No ${statusFilter === 'all' ? '' : statusFilter + ' '}estimates`
            }
            action={
              estimates.length === 0
                ? { label: 'Create Estimate', onClick: () => navigate('/customers') }
                : undefined
            }
          />
          )
        ) : (
          <div className="space-y-3">
            {sortedEstimates.map((estimate, i) => (
              <Card
                key={estimate.id}
                animationDelay={i * 40}
                className="p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Main clickable area */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/estimates/${estimate.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-base truncate">
                        {estimate.projectName || 'Untitled'}
                      </h3>
                      <Badge variant={statusBadgeVariant(estimate.status)} size="sm">
                        {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300 truncate">{estimate.customerName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-slate-500">{formatDate(estimate.createdAt)}</p>
                      {estimate.sentAt && (
                        <p className="text-xs text-blue-400/60">Sent {formatDate(estimate.sentAt)}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: total + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{fmtFull(estimate.total)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: estimate.id, name: estimate.customerName }); }}
                      className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                      aria-label="Delete estimate"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="text-slate-600" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/customers')}
        className="fixed bottom-24 right-5 z-50 w-14 h-14 bg-white text-slate-900 rounded-full shadow-[0_8px_32px_rgba(255,255,255,0.2)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        aria-label="Create new estimate"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Delete Estimate Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Estimate"
        size="sm"
      >
        <p className="text-slate-300 mb-6">
          Are you sure you want to delete the estimate for <strong className="text-white">{deleteTarget?.name}</strong>? This can't be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-semibold"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* Delete Draft Confirmation Modal */}
      <Modal
        isOpen={!!deleteDraftTarget}
        onClose={() => setDeleteDraftTarget(null)}
        title="Delete Voice Draft"
        size="sm"
      >
        <p className="text-slate-300 mb-6">
          Delete the voice draft for <strong className="text-white">{deleteDraftTarget?.name}</strong>? All voice conversation data will be lost.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteDraftTarget(null)}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteDraft}
            className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-semibold"
          >
            Delete
          </button>
        </div>
      </Modal>
    </Layout>
  );
};
