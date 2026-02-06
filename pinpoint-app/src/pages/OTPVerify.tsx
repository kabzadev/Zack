import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft } from 'lucide-react';

export const OTPVerify = () => {
  const navigate = useNavigate();
  const { tempPhoneNumber, verifyOTP } = useAuthStore();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!tempPhoneNumber) {
      navigate('/login');
    }
  }, [tempPhoneNumber, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value) {
      const fullCode = [...newCode.slice(0, 5), value].join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      handleVerify(pasted);
    }
  };

  const handleVerify = async (fullCode: string) => {
    if (!tempPhoneNumber) return;
    
    setIsLoading(true);
    setError('');

    const result = await verifyOTP(tempPhoneNumber, fullCode);
    
    if (result.success) {
      if (result.status === 'pending') {
        navigate('/pending');
      } else {
        navigate('/');
      }
    } else {
      setError(result.error || 'Invalid code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    
    setIsLoading(false);
  };

  const handleResend = async () => {
    setCountdown(60);
    setCanResend(false);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="p-6">
        <button 
          onClick={() => navigate('/login')}
          className="w-10 h-10 flex items-center justify-center bg-slate-800/60 backdrop-blur-sm rounded-xl text-white hover:bg-slate-800 transition-all border border-slate-700/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 mb-6">
            <span className="text-3xl">📱</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Enter Verification Code
          </h1>
          <p className="text-slate-400 text-base mb-2">We sent a code to</p>
          <p className="text-xl font-semibold text-white">{tempPhoneNumber}</p>
        </div>

        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <label className="block text-sm font-semibold text-white text-center mb-4">
              6-Digit Code
            </label>
            <div 
              className="flex justify-center gap-3" 
              onPaste={handlePaste}
            >
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl transition-all outline-none bg-slate-800/60 backdrop-blur-sm border ${
                    digit 
                      ? 'border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                      : 'border-slate-700/50 text-white'
                  } ${error ? 'border-red-500 shake' : ''} focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)]`}
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-400 mb-4">
              Code expires in <span className="text-white font-semibold">{formatCountdown(countdown)}</span>
            </p>

            {canResend ? (
              <button
                onClick={handleResend}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Resend code
              </button>
            ) : (
              <p className="text-slate-500 text-sm">
                Didn't receive it? Wait {countdown}s to resend
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm animate-fade-in-up">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-3 p-4 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50">
              <div className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
              <span className="text-slate-300 font-medium">Verifying...</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Troubleshooting
          </p>
          <div className="flex items-center gap-3 py-3 border-b border-slate-800/50">
            <div className="w-8 h-8 bg-slate-800/60 backdrop-blur-sm rounded-lg flex items-center justify-center text-sm border border-slate-700/50">
              📱
            </div>
            <span className="text-sm text-slate-400">Check your phone number is correct</span>
          </div>
          <div className="flex items-center gap-3 py-3 border-b border-slate-800/50">
            <div className="w-8 h-8 bg-slate-800/60 backdrop-blur-sm rounded-lg flex items-center justify-center text-sm border border-slate-700/50">
              📩
            </div>
            <span className="text-sm text-slate-400">Check spam/junk folders</span>
          </div>
          <div className="flex items-center gap-3 py-3 border-b border-slate-800/50">
            <div className="w-8 h-8 bg-slate-800/60 backdrop-blur-sm rounded-lg flex items-center justify-center text-sm border border-slate-700/50">
              📶
            </div>
            <span className="text-sm text-slate-400">Ensure you have signal</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500">
            💡 Tip: You can{' '}
            <span className="inline-block px-2 py-1 bg-slate-800/60 backdrop-blur-sm rounded text-xs font-mono text-slate-300 border border-slate-700/50 mx-1">
              paste
            </span>
            {' '}the full code
          </p>
        </div>
      </div>
    </div>
  );
};
