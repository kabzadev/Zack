import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { useVoiceDraftStore, type VoiceConversationEntry } from '../stores/voiceDraftStore';

export interface VoiceEstimateData {
  customerName: string;
  propertyAddress: string;
  projectType: string;
  numberOfRooms: number;
  paintColors: string[];
  squareFootage: number;
  numberOfPainters: number;
  estimatedDays: number;
  hourlyRate: number;
  laborCost: number;
  gallonsOfPaint: { area: string; gallons: number; product: string }[];
  notes: string;
  rawTranscript: string;
  draftId: string;
}

interface VoiceAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onEstimateReady: (data: VoiceEstimateData) => void;
  agentId: string;
  draftId?: string; // If resuming an existing draft
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  isOpen,
  onClose,
  onEstimateReady,
  agentId,
  draftId,
}) => {
  const [transcript, setTranscript] = useState<VoiceConversationEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const hasExtractedRef = useRef(false);
  const transcriptRef = useRef<VoiceConversationEntry[]>([]);
  const currentDraftIdRef = useRef<string | null>(null);

  const {
    getActiveDraft,
    getDraftById,
    createDraft,
    setActiveDraft,
    addConversationEntry,
    updateDraftFields,
    buildAgentContext,
  } = useVoiceDraftStore();

  // Keep ref in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Load previous conversation when opening with a draft
  useEffect(() => {
    if (isOpen && draftId) {
      const draft = getDraftById(draftId);
      if (draft && draft.conversationHistory.length > 0) {
        setTranscript(draft.conversationHistory);
      }
      currentDraftIdRef.current = draftId;
      setActiveDraft(draftId);
    }
  }, [isOpen, draftId, getDraftById, setActiveDraft]);

  const extractAndSaveFields = useCallback((dId: string, entries: VoiceConversationEntry[]) => {
    const allText = entries.map(t => t.message).join(' ');
    const allLower = allText.toLowerCase();

    // Extract customer name
    let customerName: string | null = null;
    const nameMatch = allText.match(/(?:for|customer(?:\s+is)?|name(?:\s+is)?|this is for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (nameMatch) customerName = nameMatch[1].trim();

    // Extract address
    let propertyAddress: string | null = null;
    const addrMatch = allText.match(/(\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Place|Pl)[\w\s,]*)/i);
    if (addrMatch) propertyAddress = addrMatch[1].trim();

    // Extract project type
    let projectType: 'interior' | 'exterior' | 'both' | null = null;
    if (allLower.includes('interior') && allLower.includes('exterior')) projectType = 'both';
    else if (allLower.includes('exterior')) projectType = 'exterior';
    else if (allLower.includes('interior')) projectType = 'interior';

    // Extract rooms
    let numberOfRooms: number | null = null;
    const roomMatch = allLower.match(/(\d+)\s*(?:rooms?|bedrooms?|areas?)/);
    if (roomMatch) numberOfRooms = parseInt(roomMatch[1], 10);

    // Extract painters
    let numberOfPainters: number | null = null;
    const painterMatch = allLower.match(/(\d+)\s*(?:guys?|painters?|men|crew|people)/);
    if (painterMatch) numberOfPainters = parseInt(painterMatch[1], 10);

    // Extract days
    let estimatedDays: number | null = null;
    const daysMatch = allLower.match(/(\d+(?:\.\d+)?)\s*days?/);
    if (daysMatch) estimatedDays = parseFloat(daysMatch[1]);

    // Extract rate
    let hourlyRate: number | null = null;
    const rateMatch = allLower.match(/(?:\$)?(\d+)\s*(?:an hour|per hour|\/hr|hourly|\/hour)/);
    if (rateMatch) hourlyRate = parseInt(rateMatch[1], 10);

    // Extract square footage
    let squareFootage: number | null = null;
    const sqftMatch = allLower.match(/(\d[\d,]*)\s*(?:square\s*(?:feet|foot|ft)|sq\s*(?:ft|feet)|sqft)/);
    if (sqftMatch) squareFootage = parseInt(sqftMatch[1].replace(/,/g, ''), 10);

    // Extract colors (SW colors + common colors)
    const swColors = [
      'agreeable gray', 'accessible beige', 'alabaster', 'repose gray', 'sea salt',
      'naval', 'pure white', 'extra white', 'snowbound', 'dover white', 'city loft',
      'passive', 'colonnade gray', 'mindful gray', 'worldly gray', 'iron ore',
      'tricorn black', 'high reflective white', 'shoji white', 'eider white',
      'modern gray', 'balanced beige', 'mega greige', 'analytical gray',
      'duration', 'emerald', 'superpaint', 'proclassic', 'pro classic',
    ];
    const colors: string[] = [];
    for (const color of swColors) {
      if (allLower.includes(color) && !colors.includes(color)) {
        colors.push(color);
      }
    }
    // Also look for SW codes like "SW 6244" or "SW6244"
    const swCodeMatches = allText.matchAll(/SW\s*(\d{4})/gi);
    for (const m of swCodeMatches) {
      const code = `SW ${m[1]}`;
      if (!colors.includes(code)) colors.push(code);
    }

    // Extract gallons
    const gallonsOfPaint: { area: string; gallons: number; product: string }[] = [];
    const gallonMatches = allLower.matchAll(/(\d+)\s*gallons?\s*(?:of\s+)?(?:(duration|superpaint|emerald|proclassic|pro classic|primer|problock))?(?:\s+(?:for\s+)?(?:the\s+)?(exterior|interior|trim|body|doors?|ceiling|walls?))?/gi);
    for (const m of gallonMatches) {
      gallonsOfPaint.push({
        gallons: parseInt(m[1], 10),
        product: m[2] || 'paint',
        area: m[3] || 'general',
      });
    }

    const updates: Record<string, unknown> = {};
    if (customerName) updates.customerName = customerName;
    if (propertyAddress) updates.propertyAddress = propertyAddress;
    if (projectType) updates.projectType = projectType;
    if (numberOfRooms != null) updates.numberOfRooms = numberOfRooms;
    if (colors.length > 0) updates.colors = colors;
    if (squareFootage != null) updates.squareFootage = squareFootage;
    if (numberOfPainters != null) updates.numberOfPainters = numberOfPainters;
    if (estimatedDays != null) updates.estimatedDays = estimatedDays;
    if (hourlyRate != null) updates.hourlyRate = hourlyRate;
    if (gallonsOfPaint.length > 0) updates.gallonsOfPaint = gallonsOfPaint;

    if (Object.keys(updates).length > 0) {
      updateDraftFields(dId, updates);
    }
  }, [updateDraftFields]);

  const buildEstimateData = useCallback((): VoiceEstimateData | null => {
    const id = currentDraftIdRef.current;
    if (!id) return null;
    
    // Run extraction one final time
    extractAndSaveFields(id, transcriptRef.current);
    
    const draft = getDraftById(id);
    if (!draft) return null;

    const fullTranscript = transcriptRef.current
      .map(t => `${t.role === 'user' ? 'You' : 'Agent'}: ${t.message}`)
      .join('\n');

    return {
      customerName: draft.customerName || '',
      propertyAddress: draft.propertyAddress || '',
      projectType: draft.projectType || '',
      numberOfRooms: draft.numberOfRooms || 0,
      paintColors: draft.colors,
      squareFootage: draft.squareFootage || 0,
      numberOfPainters: draft.numberOfPainters || 0,
      estimatedDays: draft.estimatedDays || 0,
      hourlyRate: draft.hourlyRate || 0,
      laborCost: draft.laborCost || 0,
      gallonsOfPaint: draft.gallonsOfPaint,
      notes: draft.specialNotes || '',
      rawTranscript: fullTranscript,
      draftId: id,
    };
  }, [getDraftById, extractAndSaveFields]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Voice] Connected');
      setErrorMsg(null);
    },
    onDisconnect: () => {
      console.log('[Voice] Disconnected');
      // Extract fields when conversation ends
      const id = currentDraftIdRef.current;
      if (id) {
        extractAndSaveFields(id, transcriptRef.current);
      }
    },
    onMessage: (props: { message: string; source: string }) => {
      const role = props.source === 'user' ? 'user' as const : 'agent' as const;
      const entry: VoiceConversationEntry = { role, message: props.message, timestamp: Date.now() };
      
      setTranscript(prev => [...prev, entry]);
      
      // Save to draft store
      const id = currentDraftIdRef.current;
      if (id) {
        addConversationEntry(id, entry);
      }
    },
    onError: (message: string) => {
      console.error('[Voice] Error:', message);
      setErrorMsg(String(message));
    },
  });

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg('Microphone access denied. Please allow microphone in your browser settings.');
      return;
    }

    hasExtractedRef.current = false;
    setErrorMsg(null);

    // Create or resume a draft
    let activeId = currentDraftIdRef.current;
    if (!activeId) {
      // Check for existing incomplete draft
      const activeDraft = getActiveDraft();
      if (activeDraft && !activeDraft.isComplete) {
        activeId = activeDraft.id;
      } else {
        const newDraft = createDraft();
        activeId = newDraft.id;
      }
      currentDraftIdRef.current = activeId;
    }

    // Build dynamic overrides with collected context
    const context = buildAgentContext(activeId);
    const isResume = (getDraftById(activeId)?.conversationHistory.length || 0) > 0;

    try {
      console.log('[Voice] Starting session, draft:', activeId, 'resume:', isResume);
      
      // Build overrides for the agent
      const overrides: Record<string, unknown> = {};
      
      if (isResume && context) {
        // Override the agent prompt to include context about what's been collected
        overrides.agent = {
          prompt: {
            prompt: `You are resuming an estimate conversation. Here is the current state:\n\n${context}\n\nIMPORTANT: Welcome the user back and continue collecting the missing information. Do NOT re-ask questions that have already been answered.`,
          },
          first_message: `Welcome back! Let me check where we left off...`,
        };
      }

      const sessionConfig: Record<string, unknown> = {
        agentId,
        connectionType: 'websocket',
      };
      
      if (Object.keys(overrides).length > 0) {
        sessionConfig.overrides = overrides;
      }

      const id = await conversation.startSession(sessionConfig as Parameters<typeof conversation.startSession>[0]);
      console.log('[Voice] Session started:', id);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Voice] Failed to start:', msg);
      setErrorMsg(`Failed to connect: ${msg}`);
    }
  }, [agentId, conversation, createDraft, getActiveDraft, getDraftById, buildAgentContext]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('[Voice] Failed to end:', error);
    }
  }, [conversation]);

  const handleClose = useCallback(async () => {
    if (conversation.status === 'connected') {
      await stopConversation();
    }
    onClose();
  }, [conversation.status, stopConversation, onClose]);

  const handleFinish = useCallback(async () => {
    if (conversation.status === 'connected') {
      await stopConversation();
    }
    
    if (!hasExtractedRef.current) {
      hasExtractedRef.current = true;
      const data = buildEstimateData();
      if (data) {
        onEstimateReady(data);
      }
    }
  }, [conversation.status, stopConversation, buildEstimateData, onEstimateReady]);

  if (!isOpen) return null;

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';
  const isSpeaking = conversation.isSpeaking;
  const currentDraft = currentDraftIdRef.current ? getDraftById(currentDraftIdRef.current) : null;
  const isResuming = currentDraft && currentDraft.conversationHistory.length > 0 && transcript.length === 0;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={handleClose} />

      <div className="relative z-10 flex flex-col h-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 safe-top">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Volume2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pinpoint Estimator</h2>
              <p className="text-xs text-slate-400">
                {isConnected
                  ? isSpeaking ? 'Speaking...' : 'Listening...'
                  : isConnecting ? 'Connecting...'
                  : isResuming ? 'Resuming conversation...' : 'Ready'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="w-10 h-10 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-5 mb-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Draft Status Badge */}
        {currentDraft && (
          <div className="flex justify-center py-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/20">
              <div className={`w-1.5 h-1.5 rounded-full ${currentDraft.isComplete ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-[10px] text-slate-500 font-medium">
                Draft {currentDraft.id.slice(-6)} • {currentDraft.conversationHistory.length} messages
              </span>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/30">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isConnected
                ? isSpeaking ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
                : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
            }`} />
            <span className="text-xs text-slate-400 font-medium">
              {isConnected
                ? isSpeaking ? 'Agent speaking' : 'Listening to you'
                : isConnecting ? 'Connecting to agent...' : 'Tap mic to start'}
            </span>
          </div>
        </div>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {transcript.length === 0 && !isConnected && !isConnecting ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-blue-500/20">
                <Mic size={36} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {isResuming ? 'Continue Estimate' : 'Voice Estimate'}
              </h3>
              <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed">
                {isResuming
                  ? "Tap the microphone to pick up where you left off. The agent remembers what you've already discussed."
                  : "Tap the microphone to start talking with the estimating assistant. They'll help you build a painting estimate."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcript.map((entry, i) => (
                <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    entry.role === 'user'
                      ? 'bg-blue-500/20 border border-blue-500/30 text-blue-50'
                      : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
                  }`}>
                    <p className="text-xs font-semibold mb-1 opacity-60">{entry.role === 'user' ? 'You' : 'Estimator'}</p>
                    <p className="text-sm leading-relaxed">{entry.message}</p>
                  </div>
                </div>
              ))}
              {isConnected && isSpeaking && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-5 py-6 safe-bottom">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {isConnected && !isSpeaking && (
                <>
                  <div className="absolute inset-0 -m-4 rounded-full bg-blue-500/10 animate-ping" />
                  <div className="absolute inset-0 -m-8 rounded-full bg-blue-500/5 animate-ping" style={{ animationDelay: '300ms' }} />
                </>
              )}
              <button
                onClick={isConnected ? stopConversation : startConversation}
                disabled={isConnecting}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
                  isConnected
                    ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_8px_32px_rgba(239,68,68,0.4)]'
                    : isConnecting
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 cursor-wait'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_8px_32px_rgba(59,130,246,0.4)] hover:scale-105'
                }`}
              >
                {isConnected ? <MicOff size={32} className="text-white" />
                  : isConnecting ? <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Mic size={32} className="text-white" />}
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {isConnected ? 'Tap to end conversation' : isConnecting ? 'Connecting...' : 'Tap to start'}
            </p>

            {transcript.length > 0 && !isConnected && !isConnecting && (
              <button onClick={handleFinish} className="mt-2 px-8 py-3 bg-white text-slate-950 font-semibold rounded-xl shadow-lg shadow-white/10 transition-all hover:bg-slate-100 active:scale-[0.96]">
                Create Estimate from Conversation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
