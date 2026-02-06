import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import type { Mode, Status } from '@elevenlabs/react';

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
  const [mode, setMode] = useState<Mode>('listening');
  const [, setConnectionStatus] = useState<Status>('disconnected');
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const hasExtractedRef = useRef(false);

  const conversation = useConversation({
    onConnect: () => {
      setConnectionStatus('connected');
    },
    onDisconnect: () => {
      setConnectionStatus('disconnected');
      if (!hasExtractedRef.current) {
        extractEstimateData();
      }
    },
    onMessage: (props: { message: string; role: 'user' | 'agent' }) => {
      setTranscript(prev => [
        ...prev,
        {
          role: props.role,
          message: props.message,
          timestamp: Date.now(),
        },
      ]);
    },
    onModeChange: (prop: { mode: Mode }) => {
      setMode(prop.mode);
    },
    onStatusChange: (prop: { status: Status }) => {
      setConnectionStatus(prop.status);
    },
    onError: (message: string) => {
      console.error('Voice agent error:', message);
    },
  });

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const extractEstimateData = useCallback(() => {
    if (hasExtractedRef.current) return;
    hasExtractedRef.current = true;

    const fullTranscript = transcript
      .map(t => `${t.role === 'user' ? 'Customer' : 'Damon'}: ${t.message}`)
      .join('\n');

    // Parse structured data from conversation
    const allMessages = transcript.map(t => t.message.toLowerCase()).join(' ');

    // Extract customer name - look for name mentions
    let customerName = '';
    const namePatterns = [
      /(?:my name is|i'm|i am|this is for|name is|it's for)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
      /(?:for|customer)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    ];
    for (const pattern of namePatterns) {
      const allText = transcript.map(t => t.message).join(' ');
      const match = allText.match(pattern);
      if (match) {
        customerName = match[1].trim();
        break;
      }
    }

    // Extract number of rooms
    let numberOfRooms = 0;
    const roomPatterns = [
      /(\d+)\s*(?:rooms?|bedrooms?|areas?)/i,
      /(?:rooms?|bedrooms?)\s*(?:is|are)?\s*(\d+)/i,
    ];
    for (const pattern of roomPatterns) {
      const match = allMessages.match(pattern);
      if (match) {
        numberOfRooms = parseInt(match[1], 10);
        break;
      }
    }

    // Extract paint colors
    const colorKeywords = [
      'white', 'off-white', 'cream', 'beige', 'ivory',
      'gray', 'grey', 'charcoal', 'slate',
      'blue', 'navy', 'light blue', 'sky blue', 'royal blue',
      'green', 'sage', 'mint', 'olive', 'forest green',
      'red', 'burgundy', 'crimson', 'maroon',
      'yellow', 'gold', 'mustard',
      'orange', 'coral', 'peach',
      'pink', 'blush', 'rose',
      'purple', 'lavender', 'plum',
      'brown', 'tan', 'taupe', 'mocha',
      'black',
      'agreeable gray', 'accessible beige', 'alabaster',
      'repose gray', 'mindful gray', 'sea salt',
      'dover white', 'pure white', 'extra white',
      'snowbound', 'greek villa',
    ];
    const paintColors: string[] = [];
    for (const color of colorKeywords) {
      if (allMessages.includes(color) && !paintColors.includes(color)) {
        paintColors.push(color);
      }
    }

    // Extract square footage
    let squareFootage = 0;
    const sqftPatterns = [
      /(\d[\d,]*)\s*(?:square\s*(?:feet|foot|ft)|sq\s*(?:ft|feet)|sqft)/i,
      /(?:square\s*(?:feet|footage))\s*(?:is|of)?\s*(?:about|around|roughly)?\s*(\d[\d,]*)/i,
    ];
    for (const pattern of sqftPatterns) {
      const match = allMessages.match(pattern);
      if (match) {
        squareFootage = parseInt(match[1].replace(/,/g, ''), 10);
        break;
      }
    }

    // Build notes from key discussion points
    const notes = transcript.length > 0
      ? `Voice estimate conversation with ${transcript.length} exchanges. ${
          paintColors.length > 0 ? `Colors discussed: ${paintColors.join(', ')}.` : ''
        } ${numberOfRooms > 0 ? `${numberOfRooms} rooms mentioned.` : ''}`
      : '';

    onEstimateReady({
      customerName,
      numberOfRooms,
      paintColors,
      squareFootage,
      notes,
      rawTranscript: fullTranscript,
    });
  }, [transcript, onEstimateReady]);

  const requestMicPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      return true;
    } catch {
      setMicPermission('denied');
      return false;
    }
  }, []);

  const startConversation = useCallback(async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) return;

    hasExtractedRef.current = false;
    setTranscript([]);

    try {
      await conversation.startSession({
        agentId,
        connectionType: 'websocket',
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [agentId, conversation, requestMicPermission]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to end conversation:', error);
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl"
        onClick={handleClose}
      />

      {/* Content */}
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
                  ? isSpeaking
                    ? 'Speaking...'
                    : mode === 'listening'
                      ? 'Listening...'
                      : 'Processing...'
                  : isConnecting
                    ? 'Connecting...'
                    : 'Ready'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/30">
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                isConnected
                  ? isSpeaking
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-emerald-400 animate-pulse'
                  : isConnecting
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-500'
              }`}
            />
            <span className="text-xs text-slate-400 font-medium">
              {isConnected
                ? isSpeaking
                  ? 'Agent speaking'
                  : 'Listening to you'
                : isConnecting
                  ? 'Connecting to agent...'
                  : 'Tap mic to start'}
            </span>
          </div>
        </div>

        {/* Transcript Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          {transcript.length === 0 && !isConnected && !isConnecting ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-blue-500/20">
                <Mic size={36} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Voice Estimate</h3>
              <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed">
                Tap the microphone to start talking with Damon. He&apos;ll help you build a painting estimate.
              </p>
              {micPermission === 'denied' && (
                <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm">
                    Microphone access denied. Please enable it in your browser settings.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {transcript.map((entry, i) => (
                <div
                  key={i}
                  className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      entry.role === 'user'
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-50'
                        : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-60">
                      {entry.role === 'user' ? 'You' : 'Damon'}
                    </p>
                    <p className="text-sm leading-relaxed">{entry.message}</p>
                  </div>
                </div>
              ))}

              {/* Speaking indicator */}
              {isConnected && isSpeaking && (
                <div className="flex justify-start animate-fade-in">
                  <div className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
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

        {/* Bottom Controls */}
        <div className="px-5 py-6 safe-bottom">
          {/* Mic Button */}
          <div className="flex flex-col items-center gap-4">
            {/* Pulse rings behind mic button */}
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
                className={`
                  relative w-20 h-20 rounded-full flex items-center justify-center
                  transition-all duration-300 active:scale-90
                  ${
                    isConnected
                      ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_8px_32px_rgba(239,68,68,0.4)]'
                      : isConnecting
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-[0_8px_32px_rgba(245,158,11,0.3)] cursor-wait'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_8px_32px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.5)] hover:scale-105'
                  }
                `}
              >
                {isConnected ? (
                  <MicOff size={32} className="text-white" />
                ) : isConnecting ? (
                  <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Mic size={32} className="text-white" />
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {isConnected ? 'Tap to end conversation' : isConnecting ? 'Connecting...' : 'Tap to start'}
            </p>

            {/* Finish button when conversation has transcript */}
            {transcript.length > 0 && !isConnected && !isConnecting && (
              <button
                onClick={handleFinish}
                className="mt-2 px-8 py-3 bg-white text-slate-950 font-semibold rounded-xl shadow-lg shadow-white/10 transition-all hover:bg-slate-100 active:scale-[0.96]"
              >
                Create Estimate from Conversation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
