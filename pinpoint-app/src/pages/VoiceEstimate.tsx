import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Button } from '../components';
import { VoiceAgent, type VoiceEstimateData } from '../components/VoiceAgent';
import { useVoiceDraftStore } from '../stores/voiceDraftStore';
import {
  Mic,
  User,
  Home,
  Palette,
  Ruler,
  FileText,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Clock,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Droplets,
  Trash2,
} from 'lucide-react';

const AGENT_ID = 'agent_0101kgrqw8nxenkrabks597t1nf8';

type PageState = 'idle' | 'recording' | 'review';

export const VoiceEstimate = () => {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('idle');
  const [estimateData, setEstimateData] = useState<VoiceEstimateData | null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [resumeDraftId, setResumeDraftId] = useState<string | undefined>(undefined);

  const { getIncompleteDrafts, deleteDraft, setActiveDraft, markComplete } = useVoiceDraftStore();
  const incompleteDrafts = getIncompleteDrafts();

  const handleStartNew = useCallback(() => {
    setResumeDraftId(undefined);
    setActiveDraft(null);
    setShowAgent(true);
    setPageState('recording');
  }, [setActiveDraft]);

  const handleResumeDraft = useCallback((draftId: string) => {
    setResumeDraftId(draftId);
    setActiveDraft(draftId);
    setShowAgent(true);
    setPageState('recording');
  }, [setActiveDraft]);

  const handleDeleteDraft = useCallback((draftId: string) => {
    deleteDraft(draftId);
  }, [deleteDraft]);

  const handleEstimateReady = useCallback((data: VoiceEstimateData) => {
    setEstimateData(data);
    setShowAgent(false);
    setPageState('review');
    // Mark draft as complete
    if (data.draftId) {
      markComplete(data.draftId);
    }
  }, [markComplete]);

  const handleCloseAgent = useCallback(() => {
    setShowAgent(false);
    if (!estimateData) {
      setPageState('idle');
    }
  }, [estimateData]);

  const handleCreateEstimate = useCallback(() => {
    const params = new URLSearchParams();
    if (estimateData) {
      params.set('voiceName', estimateData.customerName);
      params.set('voiceAddress', estimateData.propertyAddress);
      params.set('voiceRooms', String(estimateData.numberOfRooms));
      params.set('voiceColors', estimateData.paintColors.join(','));
      params.set('voiceSqft', String(estimateData.squareFootage));
      params.set('voicePainters', String(estimateData.numberOfPainters));
      params.set('voiceDays', String(estimateData.estimatedDays));
      params.set('voiceRate', String(estimateData.hourlyRate));
      params.set('voiceLabor', String(estimateData.laborCost));
      params.set('voiceNotes', estimateData.notes);
      if (estimateData.draftId) params.set('draftId', estimateData.draftId);
    }
    navigate(`/customers?from=voice&${params.toString()}`);
  }, [estimateData, navigate]);

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

  const summaryItems = estimateData
    ? [
        { icon: <User size={18} />, label: 'Customer', value: estimateData.customerName || 'Not mentioned', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
        { icon: <MapPin size={18} />, label: 'Address', value: estimateData.propertyAddress || 'Not mentioned', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
        { icon: <Home size={18} />, label: 'Rooms', value: estimateData.numberOfRooms > 0 ? `${estimateData.numberOfRooms} rooms` : 'Not mentioned', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
        { icon: <Palette size={18} />, label: 'Colors', value: estimateData.paintColors.length > 0 ? estimateData.paintColors.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') : 'Not mentioned', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
        { icon: <Ruler size={18} />, label: 'Square Footage', value: estimateData.squareFootage > 0 ? `${estimateData.squareFootage.toLocaleString()} sq ft` : 'Not mentioned', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
        { icon: <Users size={18} />, label: 'Crew', value: estimateData.numberOfPainters > 0 ? `${estimateData.numberOfPainters} painters` : 'Not mentioned', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
        { icon: <Calendar size={18} />, label: 'Duration', value: estimateData.estimatedDays > 0 ? `${estimateData.estimatedDays} days` : 'Not mentioned', color: 'text-teal-400', bgColor: 'bg-teal-500/10' },
        { icon: <DollarSign size={18} />, label: 'Rate', value: estimateData.hourlyRate > 0 ? `$${estimateData.hourlyRate}/hr` : 'Not mentioned', color: 'text-green-400', bgColor: 'bg-green-500/10' },
        { icon: <DollarSign size={18} />, label: 'Labor Cost', value: estimateData.laborCost > 0 ? `$${estimateData.laborCost.toLocaleString()}` : 'Not calculated', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
        { icon: <Droplets size={18} />, label: 'Paint', value: estimateData.gallonsOfPaint.length > 0 ? estimateData.gallonsOfPaint.map(g => `${g.gallons}gal ${g.product}`).join(', ') : 'Not mentioned', color: 'text-sky-400', bgColor: 'bg-sky-500/10' },
        { icon: <FileText size={18} />, label: 'Notes', value: estimateData.notes || 'No additional notes', color: 'text-slate-400', bgColor: 'bg-slate-500/10' },
      ]
    : [];

  return (
    <Layout showBack title="Voice Estimate" activeTab="estimates">
      <div className="px-5 pt-6 pb-32">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Voice Estimate</h1>
              <p className="text-sm text-slate-400">Talk to build your estimate</p>
            </div>
          </div>
        </div>

        {/* Idle State */}
        {pageState === 'idle' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Resume drafts */}
            {incompleteDrafts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={14} />
                  Continue where you left off
                </h3>
                <div className="space-y-3">
                  {incompleteDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="relative bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">
                            {draft.customerName || 'Unnamed Customer'}
                          </p>
                          {draft.propertyAddress && (
                            <p className="text-xs text-slate-500 mt-0.5">{draft.propertyAddress}</p>
                          )}
                          <p className="text-xs text-slate-600 mt-1">
                            {draft.conversationHistory.length} messages • {formatTimeAgo(draft.updatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDraft(draft.id); }}
                          className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {/* What's been collected */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {draft.customerName && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Customer ✓</span>}
                        {draft.projectType && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{draft.projectType} ✓</span>}
                        {draft.colors.length > 0 && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Colors ✓</span>}
                        {draft.numberOfPainters && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Crew ✓</span>}
                        {draft.hourlyRate && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Rate ✓</span>}
                        {!draft.squareFootage && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Sq ft needed</span>}
                        {!draft.numberOfPainters && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Crew needed</span>}
                      </div>

                      <button
                        onClick={() => handleResumeDraft(draft.id)}
                        className="w-full py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-sm rounded-xl hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Mic size={16} />
                        Continue Conversation
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New estimate button */}
            <div className="flex flex-col items-center pt-4">
              <div className="relative mb-8">
                <div className="absolute inset-0 -m-6 rounded-full bg-blue-500/5 animate-pulse" />
                <div className="absolute inset-0 -m-3 rounded-full bg-blue-500/10 animate-pulse" style={{ animationDelay: '500ms' }} />
                <button
                  onClick={handleStartNew}
                  className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-[0_16px_64px_rgba(59,130,246,0.4)] hover:shadow-[0_20px_80px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <Mic size={48} className="text-white" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">
                {incompleteDrafts.length > 0 ? 'Start New Estimate' : 'Start Voice Estimate'}
              </h2>
              <p className="text-slate-400 text-center text-sm max-w-[300px] leading-relaxed mb-8">
                The agent will ask about the project — customer, rooms, colors, crew, and materials. Just talk naturally.
              </p>

              {/* How it works */}
              <Card className="w-full">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">How it works</h3>
                <div className="space-y-4">
                  {[
                    { step: '1', text: 'Tap the mic to start a conversation' },
                    { step: '2', text: 'Answer questions about the painting job' },
                    { step: '3', text: "Leave anytime — your progress is saved" },
                    { step: '4', text: 'Come back to continue, then create the estimate' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-400">{item.step}</span>
                      </div>
                      <p className="text-sm text-slate-300">{item.text}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Review State */}
        {pageState === 'review' && estimateData && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-400 text-sm">Conversation Complete</p>
                <p className="text-xs text-slate-400">Here&apos;s what was captured from your conversation</p>
              </div>
            </div>

            <Card>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Estimate Details</h3>
              <div className="space-y-3">
                {summaryItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <div className={`w-9 h-9 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-medium mb-0.5">{item.label}</p>
                      <p className="text-sm text-white font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {estimateData.rawTranscript && (
              <Card>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Conversation Transcript</h3>
                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">{estimateData.rawTranscript}</p>
                </div>
              </Card>
            )}

            <div className="space-y-3 pt-2">
              <Button fullWidth size="lg" icon={<ChevronRight size={20} />} onClick={handleCreateEstimate}>
                Create Estimate
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth icon={<Mic size={18} />} onClick={() => { setResumeDraftId(estimateData.draftId); setShowAgent(true); setPageState('recording'); }}>
                  Add More Info
                </Button>
                <Button variant="ghost" fullWidth icon={<RotateCcw size={18} />} onClick={handleStartOver}>
                  Start Over
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Agent Overlay */}
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
