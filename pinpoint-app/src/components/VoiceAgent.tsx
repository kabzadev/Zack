import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, X, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useVoiceDraftStore, type VoiceConversationEntry, type VoiceDraft } from '../stores/voiceDraftStore';

export interface VoiceEstimateData {
  draft: VoiceDraft;
  rawTranscript: string;
}

interface VoiceAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onEstimateReady: (data: VoiceEstimateData) => void;
  agentId: string;
  draftId?: string;
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

  const store = useVoiceDraftStore();

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // Load previous conversation when resuming
  useEffect(() => {
    if (isOpen && draftId) {
      const draft = store.getDraftById(draftId);
      if (draft && draft.conversationHistory.length > 0) {
        setTranscript(draft.conversationHistory);
      }
      currentDraftIdRef.current = draftId;
      store.setActiveDraft(draftId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, draftId]);

  // Extract structured data from conversation text
  const extractFields = useCallback((dId: string, entries: VoiceConversationEntry[]) => {
    const allText = entries.map(t => t.message).join(' ');
    const allLower = allText.toLowerCase();
    const updates: Partial<VoiceDraft> = {};

    // Customer name
    const nameMatch = allText.match(/(?:for|customer(?:\s+is)?|name(?:\s+is)?|this is for|estimate for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
    if (nameMatch) updates.customerName = nameMatch[1].trim();

    // Address
    const addrMatch = allText.match(/(\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Place|Pl)[\w\s,]*(?:,\s*\w[\w\s]*)?)/i);
    if (addrMatch) updates.propertyAddress = addrMatch[1].trim();

    // Project type
    if (allLower.includes('interior') && allLower.includes('exterior')) updates.projectType = 'both';
    else if (allLower.includes('exterior')) updates.projectType = 'exterior';
    else if (allLower.includes('interior')) updates.projectType = 'interior';

    // Areas/rooms
    const roomNames = ['living room', 'kitchen', 'hallway', 'master bedroom', 'bedroom', 'bathroom',
      'dining room', 'family room', 'basement', 'garage', 'foyer', 'laundry', 'office',
      'exterior body', 'trim', 'front door', 'back door', 'ceiling', 'accent wall'];
    const areas: string[] = [];
    for (const room of roomNames) {
      if (allLower.includes(room) && !areas.includes(room)) areas.push(room);
    }
    if (areas.length > 0) updates.areas = areas;

    // Number of rooms
    const roomCountMatch = allLower.match(/(\d+)\s*(?:rooms?|bedrooms?|areas?)/);
    if (roomCountMatch && areas.length === 0) {
      updates.areas = [`${roomCountMatch[1]} rooms`];
    }

    // Painters
    const painterMatch = allLower.match(/(\d+)\s*(?:guys?|painters?|men|crew|people)/);
    if (painterMatch) updates.numberOfPainters = parseInt(painterMatch[1], 10);

    // Days
    const daysMatch = allLower.match(/(\d+(?:\.\d+)?)\s*days?/);
    if (daysMatch) updates.estimatedDays = parseFloat(daysMatch[1]);

    // Hours per day
    const hrsMatch = allLower.match(/(\d+)\s*hours?\s*(?:per|a)\s*day/);
    if (hrsMatch) updates.hoursPerDay = parseInt(hrsMatch[1], 10);

    // Rate
    const rateMatch = allLower.match(/(?:\$)?(\d+)\s*(?:an hour|per hour|\/hr|hourly|\/hour)/);
    if (rateMatch) updates.hourlyRate = parseInt(rateMatch[1], 10);

    // Square footage
    const sqftMatch = allLower.match(/(\d[\d,]*)\s*(?:square\s*(?:feet|foot|ft)|sq\s*(?:ft|feet)|sqft)/);
    if (sqftMatch) {
      // Store as an area note
      const sqft = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
      if (!updates.areas) updates.areas = [];
      const sqftNote = `~${sqft.toLocaleString()} sq ft`;
      if (!updates.areas.includes(sqftNote)) updates.areas.push(sqftNote);
    }

    // Paint products & gallons
    const productPrices: Record<string, number> = {
      'duration': 75, 'duration home': 65, 'superpaint': 55, 'super paint': 55,
      'emerald': 85, 'proclassic': 70, 'pro classic': 70, 'problock': 45,
      'primer': 45, 'pro block': 45,
    };
    
    const gallonRegex = /(\d+)\s*gallons?\s*(?:of\s+)?(?:(duration home|duration|superpaint|super paint|emerald|proclassic|pro classic|problock|pro block|primer))?(?:\s+(?:for\s+)?(?:the\s+)?(exterior|interior|body|trim|doors?|ceiling|walls?|accent))?/gi;
    const paintItems = [...(store.getDraftById(dId)?.paintItems || [])];
    let gallonMatch;
    while ((gallonMatch = gallonRegex.exec(allLower)) !== null) {
      const gallons = parseInt(gallonMatch[1], 10);
      const product = gallonMatch[2] || 'paint';
      const area = gallonMatch[3] || 'general';
      // Avoid duplicates
      const exists = paintItems.some(p => p.gallons === gallons && p.product === product && p.area === area);
      if (!exists) {
        paintItems.push({
          area,
          product,
          gallons,
          finish: product.includes('classic') ? 'semi-gloss' : 'flat',
          color: '',
          coats: 2,
          pricePerGallon: productPrices[product] || 55,
        });
      }
    }
    if (paintItems.length > 0) updates.paintItems = paintItems;

    // Colors
    const swColors: Record<string, string> = {
      'naval': 'SW 6244', 'alabaster': 'SW 7008', 'sea salt': 'SW 6204',
      'agreeable gray': 'SW 7029', 'repose gray': 'SW 7015', 'pure white': 'SW 7005',
      'extra white': 'SW 7006', 'iron ore': 'SW 7069', 'tricorn black': 'SW 6258',
      'city loft': 'SW 7631', 'dover white': 'SW 6385', 'snowbound': 'SW 7004',
      'mindful gray': 'SW 7016', 'passive': 'SW 7064', 'accessible beige': 'SW 7036',
      'colonnade gray': 'SW 7641', 'worldly gray': 'SW 7043',
    };
    
    const colorAssignments = [...(store.getDraftById(dId)?.colorAssignments || [])];
    for (const [name, code] of Object.entries(swColors)) {
      if (allLower.includes(name)) {
        const exists = colorAssignments.some(c => c.color.toLowerCase() === name);
        if (!exists) {
          colorAssignments.push({ area: 'general', color: name, swCode: code });
        }
      }
    }
    // SW codes like SW 6244
    const swCodeMatches = allText.matchAll(/SW\s*(\d{4})/gi);
    for (const m of swCodeMatches) {
      const code = `SW ${m[1]}`;
      const exists = colorAssignments.some(c => c.swCode === code);
      if (!exists) {
        colorAssignments.push({ area: 'general', color: code, swCode: code });
      }
    }
    if (colorAssignments.length > 0) updates.colorAssignments = colorAssignments;

    // Scope of work
    const prepItems = ['patch', 'sand', 'caulk', 'prime', 'pressure wash', 'scrape',
      'protect flooring', 'protect furniture', 'drop cloth', 'tape off', 'mask',
      'wallpaper removal', 'drywall repair', 'skim coat'];
    const scope: string[] = [];
    for (const item of prepItems) {
      if (allLower.includes(item)) scope.push(item);
    }
    if (scope.length > 0) updates.scopeOfWork = scope;

    if (Object.keys(updates).length > 0) {
      store.updateDraftFields(dId, updates);
    }
  }, [store]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Voice] Connected');
      setErrorMsg(null);
    },
    onDisconnect: () => {
      console.log('[Voice] Disconnected');
      const id = currentDraftIdRef.current;
      if (id) extractFields(id, transcriptRef.current);
    },
    onMessage: (props: { message: string; source: string }) => {
      const role = props.source === 'user' ? 'user' as const : 'agent' as const;
      const entry: VoiceConversationEntry = { role, message: props.message, timestamp: Date.now() };
      setTranscript(prev => [...prev, entry]);
      const id = currentDraftIdRef.current;
      if (id) {
        store.addConversationEntry(id, entry);
        // Extract after each message for live updates
        extractFields(id, [...transcriptRef.current, entry]);
      }
    },
    onError: (message: string) => {
      console.error('[Voice] Error:', message);
      setErrorMsg(String(message));
    },
  });

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

    let activeId = currentDraftIdRef.current;
    if (!activeId) {
      const activeDraft = store.getActiveDraft();
      if (activeDraft && !activeDraft.isComplete) {
        activeId = activeDraft.id;
      } else {
        activeId = store.createDraft().id;
      }
      currentDraftIdRef.current = activeId;
    }

    const context = store.buildAgentContext(activeId);
    const isResume = (store.getDraftById(activeId)?.conversationHistory.length || 0) > 0;

    try {
      const sessionConfig: Record<string, unknown> = {
        agentId,
        connectionType: 'websocket',
      };

      if (isResume && context) {
        sessionConfig.overrides = {
          agent: {
            prompt: {
              prompt: `You are resuming an estimate conversation. Here is the current state:\n\n${context}`,
            },
            first_message: `Welcome back! Let me check where we left off on this estimate...`,
          },
        };
      }

      await conversation.startSession(sessionConfig as Parameters<typeof conversation.startSession>[0]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setErrorMsg(`Failed to connect: ${msg}`);
    }
  }, [agentId, conversation, store]);

  const stopConversation = useCallback(async () => {
    try { await conversation.endSession(); } catch (e) { console.error('[Voice] End error:', e); }
  }, [conversation]);

  const handleClose = useCallback(async () => {
    if (conversation.status === 'connected') await stopConversation();
    onClose();
  }, [conversation.status, stopConversation, onClose]);

  const handleFinish = useCallback(async () => {
    if (conversation.status === 'connected') await stopConversation();
    if (!hasExtractedRef.current) {
      hasExtractedRef.current = true;
      const id = currentDraftIdRef.current;
      if (id) {
        extractFields(id, transcriptRef.current);
        const draft = store.getDraftById(id);
        if (draft) {
          const fullTranscript = transcriptRef.current
            .map(t => `${t.role === 'user' ? 'You' : 'Agent'}: ${t.message}`)
            .join('\n');
          onEstimateReady({ draft, rawTranscript: fullTranscript });
        }
      }
    }
  }, [conversation.status, stopConversation, extractFields, store, onEstimateReady]);

  if (!isOpen) return null;

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';
  const isSpeaking = conversation.isSpeaking;
  const currentDraft = currentDraftIdRef.current ? store.getDraftById(currentDraftIdRef.current) : null;
  const completionPct = currentDraftIdRef.current ? store.getCompletionPercent(currentDraftIdRef.current) : 0;
  const missingFields = currentDraftIdRef.current ? store.getMissingFields(currentDraftIdRef.current) : [];

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
                  : isConnecting ? 'Connecting...' : 'Ready'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="w-10 h-10 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mb-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Progress Bar */}
        {currentDraft && transcript.length > 0 && (
          <div className="mx-5 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500 font-medium">Estimate completion</span>
              <span className="text-[10px] text-slate-400 font-semibold">{completionPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {missingFields.length > 0 && missingFields.length <= 3 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertCircle size={10} className="text-amber-400 flex-shrink-0" />
                <span className="text-[10px] text-amber-400/80 truncate">
                  Still need: {missingFields.slice(0, 3).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {transcript.length === 0 && !isConnected && !isConnecting ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-blue-500/20">
                <Mic size={36} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {currentDraft?.conversationHistory.length ? 'Continue Estimate' : 'Voice Estimate'}
              </h3>
              <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed">
                Tap the microphone to start. The assistant will walk you through every field needed for a complete estimate.
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
            {/* Collected data summary chips */}
            {currentDraft && (
              <div className="flex flex-wrap justify-center gap-1.5 max-w-full">
                {currentDraft.customerName && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 size={8} /> {currentDraft.customerName}
                  </span>
                )}
                {currentDraft.projectType && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <CheckCircle2 size={8} /> {currentDraft.projectType}
                  </span>
                )}
                {currentDraft.laborCost != null && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                    <CheckCircle2 size={8} /> ${currentDraft.laborCost.toLocaleString()} labor
                  </span>
                )}
                {currentDraft.paintItems.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                    <CheckCircle2 size={8} /> {currentDraft.paintItems.reduce((s, p) => s + p.gallons, 0)} gal paint
                  </span>
                )}
                {currentDraft.colorAssignments.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <CheckCircle2 size={8} /> {currentDraft.colorAssignments.length} colors
                  </span>
                )}
              </div>
            )}

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
                {completionPct >= 80 ? 'Finalize Estimate' : 'Review What We Have'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
