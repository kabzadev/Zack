import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Button } from '../components';
import { VoiceAgent, type VoiceEstimateData } from '../components/VoiceAgent';
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
} from 'lucide-react';

const AGENT_ID = 'agent_2501k5knax1rekftdrkq7cbv64kc';

type PageState = 'idle' | 'recording' | 'review';

export const VoiceEstimate = () => {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('idle');
  const [estimateData, setEstimateData] = useState<VoiceEstimateData | null>(null);
  const [showAgent, setShowAgent] = useState(false);

  const handleStartRecording = useCallback(() => {
    setShowAgent(true);
    setPageState('recording');
  }, []);

  const handleEstimateReady = useCallback((data: VoiceEstimateData) => {
    setEstimateData(data);
    setShowAgent(false);
    setPageState('review');
  }, []);

  const handleCloseAgent = useCallback(() => {
    setShowAgent(false);
    if (!estimateData) {
      setPageState('idle');
    }
  }, [estimateData]);

  const handleCreateEstimate = useCallback(() => {
    // Navigate to estimate builder with voice data encoded as query params
    const params = new URLSearchParams();
    if (estimateData) {
      params.set('voiceName', estimateData.customerName);
      params.set('voiceRooms', String(estimateData.numberOfRooms));
      params.set('voiceColors', estimateData.paintColors.join(','));
      params.set('voiceSqft', String(estimateData.squareFootage));
      params.set('voiceNotes', estimateData.notes);
    }
    navigate(`/customers?from=voice&${params.toString()}`);
  }, [estimateData, navigate]);

  const handleStartOver = useCallback(() => {
    setEstimateData(null);
    setPageState('idle');
  }, []);

  const summaryItems = estimateData
    ? [
        {
          icon: <User size={18} />,
          label: 'Customer',
          value: estimateData.customerName || 'Not mentioned',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
        },
        {
          icon: <Home size={18} />,
          label: 'Rooms',
          value: estimateData.numberOfRooms > 0 ? `${estimateData.numberOfRooms} rooms` : 'Not mentioned',
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
        },
        {
          icon: <Palette size={18} />,
          label: 'Colors',
          value:
            estimateData.paintColors.length > 0
              ? estimateData.paintColors.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')
              : 'Not mentioned',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
        },
        {
          icon: <Ruler size={18} />,
          label: 'Square Footage',
          value:
            estimateData.squareFootage > 0
              ? `${estimateData.squareFootage.toLocaleString()} sq ft`
              : 'Not mentioned',
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
        },
        {
          icon: <FileText size={18} />,
          label: 'Notes',
          value: estimateData.notes || 'No additional notes',
          color: 'text-slate-400',
          bgColor: 'bg-slate-500/10',
        },
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
              <p className="text-sm text-slate-400">Talk to Damon, our AI estimating assistant</p>
            </div>
          </div>
        </div>

        {/* Idle State - Start Button */}
        {pageState === 'idle' && (
          <div className="flex flex-col items-center pt-8 animate-fade-in-up">
            {/* Hero mic button */}
            <div className="relative mb-8">
              {/* Outer pulse rings */}
              <div className="absolute inset-0 -m-6 rounded-full bg-blue-500/5 animate-pulse" />
              <div className="absolute inset-0 -m-3 rounded-full bg-blue-500/10 animate-pulse" style={{ animationDelay: '500ms' }} />

              <button
                onClick={handleStartRecording}
                className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-[0_16px_64px_rgba(59,130,246,0.4)] hover:shadow-[0_20px_80px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <Mic size={48} className="text-white" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Start Voice Estimate</h2>
            <p className="text-slate-400 text-center text-sm max-w-[300px] leading-relaxed mb-8">
              Damon will ask about the project — customer name, rooms, colors, and square footage. Just talk naturally.
            </p>

            {/* How it works */}
            <Card className="w-full">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                How it works
              </h3>
              <div className="space-y-4">
                {[
                  { step: '1', text: 'Tap the microphone to connect with Damon' },
                  { step: '2', text: 'Answer questions about the painting project' },
                  { step: '3', text: 'Review the extracted info & create your estimate' },
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
        )}

        {/* Review State - Summary Card */}
        {pageState === 'review' && estimateData && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Success banner */}
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-400 text-sm">Conversation Complete</p>
                <p className="text-xs text-slate-400">Here&apos;s what Damon captured from your conversation</p>
              </div>
            </div>

            {/* Summary items */}
            <Card>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Estimate Details
              </h3>
              <div className="space-y-3">
                {summaryItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30"
                  >
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

            {/* Raw transcript preview */}
            {estimateData.rawTranscript && (
              <Card>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                  Conversation Transcript
                </h3>
                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                    {estimateData.rawTranscript}
                  </p>
                </div>
              </Card>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <Button
                fullWidth
                size="lg"
                icon={<ChevronRight size={20} />}
                onClick={handleCreateEstimate}
              >
                Create Estimate
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  icon={<Mic size={18} />}
                  onClick={handleStartRecording}
                >
                  Redo Voice
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  icon={<RotateCcw size={18} />}
                  onClick={handleStartOver}
                >
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
      />
    </Layout>
  );
};
