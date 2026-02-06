import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { MessageCircle, X, Mic, MicOff, Volume2 } from 'lucide-react';

const ASSISTANT_AGENT_ID = 'agent_6601kgsyy9fhe6tsbwhp7mjzv51j';

interface Message {
  role: 'user' | 'agent';
  text: string;
}

export const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => setError(null),
    onDisconnect: () => {},
    onMessage: (props: { message: string; source: string }) => {
      const role = props.source === 'user' ? 'user' as const : 'agent' as const;
      setMessages(prev => [...prev, { role, text: props.message }]);
    },
    onError: (msg: string) => setError(String(msg)),
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access needed');
      return;
    }
    try {
      await conversation.startSession({ agentId: ASSISTANT_AGENT_ID } as Parameters<typeof conversation.startSession>[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    }
  }, [conversation]);

  const endSession = useCallback(async () => {
    try { await conversation.endSession(); } catch {}
  }, [conversation]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      if (conversation.status === 'connected') endSession();
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isOpen, conversation.status, endSession]);

  const handleClose = useCallback(() => {
    if (conversation.status === 'connected') endSession();
    setIsOpen(false);
    setMessages([]);
    setError(null);
  }, [conversation.status, endSession]);

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';
  const isSpeaking = conversation.isSpeaking;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-24 left-4 z-[100] w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          aria-label="Ask assistant"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-3 right-3 z-[150] max-w-sm animate-fade-in-up">
          <div className="rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[60vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Volume2 size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Pinpoint Assistant</p>
                  <p className="text-[10px] text-slate-500">
                    {isConnected ? (isSpeaking ? 'Speaking...' : 'Listening...') : 'Tap mic to talk'}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[120px] max-h-[40vh]">
              {messages.length === 0 && !isConnected && !isConnecting && (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500">Ask me anything about painting, colors, estimating, or the app.</p>
                </div>
              )}
              <div className="space-y-2.5">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-500/20 text-blue-50 border border-blue-500/20'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/50'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isConnected && isSpeaking && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 pb-2">
                <p className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg">{error}</p>
              </div>
            )}

            {/* Mic Control */}
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-center">
              <button
                onClick={isConnected ? endSession : startSession}
                disabled={isConnecting}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isConnected
                    ? 'bg-red-500 shadow-lg shadow-red-500/30'
                    : isConnecting
                      ? 'bg-amber-500 cursor-wait'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 hover:scale-105'
                }`}
              >
                {isConnected ? <MicOff size={24} className="text-white" />
                  : isConnecting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Mic size={24} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
