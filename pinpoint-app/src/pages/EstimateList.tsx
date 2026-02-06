import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimateStore } from '../stores/estimateStore';
import { useVoiceDraftStore } from '../stores/voiceDraftStore';
import { Layout, Card, Badge, EmptyState } from '../components';
import { Plus, Mic } from 'lucide-react';

type EstimateStatusFilter = 'all' | 'draft' | 'sent' | 'approved';

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
  const { estimates } = useEstimateStore();
  const voiceDraftStore = useVoiceDraftStore();
  const incompleteDrafts = voiceDraftStore.getIncompleteDrafts();

  const [statusFilter, setStatusFilter] = useState<EstimateStatusFilter>('all');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') {
      return estimates;
    }
    return estimates.filter(est => est.status === statusFilter);
  }, [estimates, statusFilter]);

  const sortedEstimates = useMemo(() => {
    return [...filtered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [filtered]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusTabs: { value: EstimateStatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'approved', label: 'Approved' },
  ];

  return (
    <Layout activeTab="estimates">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Estimates</h1>
        </div>
        <p className="text-slate-400 text-sm">
          {filtered.length} of {estimates.length} estimates
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Drafts In Progress */}
      {incompleteDrafts.length > 0 && (
        <div className="px-5 pb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Mic size={12} /> Voice Drafts In Progress
          </p>
          <div className="space-y-2">
            {incompleteDrafts.map((draft) => {
              const pct = voiceDraftStore.getCompletionPercent(draft.id);
              return (
                <Card
                  key={draft.id}
                  clickable
                  onClick={() => navigate('/voice-estimate')}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
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
                    <div className="text-right flex-shrink-0">
                      {draft.estimateTotal != null && draft.estimateTotal > 0 ? (
                        <>
                          <p className="text-xl font-bold text-white">{fmt(draft.estimateTotal)}</p>
                          <p className="text-xs text-slate-600">est.</p>
                        </>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Mic size={18} className="text-blue-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Mini progress bar */}
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
          incompleteDrafts.length > 0 ? null : (
          <EmptyState
            icon="📊"
            title={estimates.length === 0 ? 'No estimates yet' : 'No estimates found'}
            description={
              estimates.length === 0
                ? 'Create your first estimate to get started'
                : `No ${statusFilter} estimates found`
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
                clickable
                onClick={() => navigate(`/estimates/new?customer=${estimate.customerId}`)}
                animationDelay={i * 40}
                className="p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Customer & Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-base truncate">
                        {estimate.customerName}
                      </h3>
                      <Badge variant={statusBadgeVariant(estimate.status)} size="sm">
                        {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300 mb-2 truncate">{estimate.projectName}</p>
                    <p className="text-xs text-slate-500">{formatDate(estimate.updatedAt)}</p>
                  </div>

                  {/* Right: Total */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-white">{fmt(estimate.total)}</p>
                    <p className="text-xs text-slate-600">total</p>
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
    </Layout>
  );
};
