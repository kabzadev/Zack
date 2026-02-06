import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';

export interface VoiceEstimateData {
  customerName: string;
  numberOfRooms: number;
  paintColors: string[];
  squareFootage: number;
  notes: string;
  rawTranscript: string;
}

interface TranscriptEntry {
  role: 'user' | 'agent';
  message: string;
  timestamp: number;
}

interface VoiceAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onEstimateReady: (data: VoiceEstimateData) => void;
  agentId: string;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  isOpen,
  onClose,
  onEstimateReady,
  agentId,
}) => {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const hasExtractedRef = useRef(false);
  const transcriptRef = useRef<TranscriptEntry[]>([]);

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const extractEstimateData = useCallback(() => {
    if (hasExtractedRef.current) return;
    hasExtractedRef.current = true;

    const currentTranscript = transcriptRef.current;
    const fullTranscript = currentTranscript
      .map(t => `${t.role === 'user' ? 'You' : 'Damon'}: ${t.message}`)
      .join('\n');

    const allMessages = currentTranscript.map(t => t.message.toLowerCase()).join(' ');
    const allText = currentTranscript.map(t => t.message).join(' ');

    // Extract customer name
    let customerName = '';
    const namePatterns = [
      /(?:my name is|i'm|i am|this is for|name is|it's for|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    ];
    for (const pattern of namePatterns) {
      const match = allText.match(pattern);
      if (match) {
        customerName = match[1].trim();
        break;
      }
    }

    // Extract rooms
    let numberOfRooms = 0;
    const roomMatch = allMessages.match(/(\d+)\s*(?:rooms?|bedrooms?|areas?)/i);
    if (roomMatch) numberOfRooms = parseInt(roomMatch[1], 10);

    // Extract colors
    const colorKeywords = [
      'agreeable gray', 'accessible beige', 'alabaster', 'repose gray', 'sea salt',
      'naval', 'pure white', 'extra white', 'snowbound', 'dover white',
      'white', 'cream', 'beige', 'gray', 'grey', 'blue', 'navy',
      'green', 'sage', 'red', 'yellow', 'orange', 'black', 'brown', 'tan',
    ];
    const paintColors: string[] = [];
    for (const color of colorKeywords) {
      if (allMessages.includes(color) && !paintColors.includes(color)) {
        paintColors.push(color);
      }
    }

    // Extract sq footage
    let squareFootage = 0;
    const sqftMatch = allMessages.match(/(\d[\d,]*)\s*(?:square\s*(?:feet|foot|ft)|sq\s*(?:ft|feet)|sqft)/i);
    if (sqftMatch) squareFootage = parseInt(sqftMatch[1].replace(/,/g, ''), 10);

    const notes = currentTranscript.length > 0
      ? `Voice conversation (${currentTranscript.length} messages). ${paintColors.length > 0 ? `Colors: ${paintColors.join(', ')}.` : ''}`
      : '';

    onEstimateReady({
      customerName, numberOfRooms, paintColors, squareFootage, notes, rawTranscript: fullTranscript,
    });
  }, [onEstimateReady]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Voice] Connected to Damon');
      setErrorMsg(null);
    },
    onDisconnect: () => {
      console.log('[Voice] Disconnected');
    },
    onMessage: (props: { message: string; source: string }) => {
      const role = props.source === 'user' ? 'user' as const : 'agent' as const;
      setTranscript(prev => [...prev, { role, message: props.message, timestamp: Date.now() }]);
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
      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg('Microphone access denied. Please allow microphone in your browser settings.');
      return;
    }

    hasExtractedRef.current = false;
    setTranscript([]);
    setErrorMsg(null);

    try {
      console.log('[Voice] Starting session with agent:', agentId);
      const id = await conversation.startSession({
        agentId,
        connectionType: 'websocket',
      });
      console.log('[Voice] Session started, id:', id);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Voice] Failed to start:', msg);
      setErrorMsg(`Failed to connect: ${msg}`);
    }
  }, [agentId, conversation]);

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
    extractEstimateData();
  }, [conversation.status, stopConversation, extractEstimateData]);

  if (!isOpen) return null;

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';
  const isSpeaking = conversation.isSpeaking;

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
              <h2 className="text-lg font-bold text-white">Damon</h2>
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

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-5 mb-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{errorMsg}</p>
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
              <h3 className="text-xl font-bold text-white mb-2">Voice Estimate</h3>
              <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed">
                Tap the microphone to start talking with Damon. He'll help you build a painting estimate.
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
                    <p className="text-xs font-semibold mb-1 opacity-60">{entry.role === 'user' ? 'You' : 'Damon'}</p>
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
