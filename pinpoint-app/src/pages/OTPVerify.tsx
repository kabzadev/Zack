import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const OTPVerify = () => {
  const navigate = useNavigate();
  const { tempPhoneNumber, verifyOTP } = useAuthStore();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no phone number
  useEffect(() => {
    if (!tempPhoneNumber) {
      navigate('/login');
    }
  }, [tempPhoneNumber, navigate]);

  // Countdown timer
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
    <div className="min-h-screen bg-pinpoint-dark flex flex-col">
      {/* Back Button */}
      <div className="p-6">
        <button 
          onClick={() => navigate('/login')}
          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-white text-xl hover:bg-white/20 transition-all"
        >
          ‹
        </button>
      </div>

      {/* Header */}
      <div className="px-6 pb-8 text-center">
        <p className="text-gray-400 text-base mb-2">We sent a code to</p>
        <p className="text-xl font-semibold text-white">{tempPhoneNumber}</p>
      </div>

      {/* OTP Input */}
      <div className="px-6 text-center">
        <label className="block text-sm font-semibold text-white mb-5">
          Enter 6-digit code
        </label>
        <div 
          className="flex justify-center gap-3 mb-6" 
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
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl transition-all outline-none
                ${digit 
                  ? 'bg-white/10 border-2 border-transparent text-white' 
                  : 'bg-white/5 border-2 border-transparent text-white'}
                ${error ? 'border-red-500' : ''}
                focus:border-pinpoint-blue`}
            />
          ))}
        </div>

        {/* Timer */}
        <p className="text-sm text-gray-400 mb-8">
          Code expires in <span className="text-gray-300 font-medium">{formatCountdown(countdown)}</span>
        </p>

        {/* Resend */}
        <div className="mb-6">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-pinpoint-blue hover:text-blue-400 font-semibold transition-colors"
            >
              Resend code
            </button>
          ) : (
            <p className="text-gray-500 text-sm">
              Didn't receive it? <span className="text-gray-400">Wait {countdown}s to resend</span>
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="mx-6 mb-6 p-4 bg-white/5 rounded-xl flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-gray-400">Verifying...</span>
        </div>
      )}

      {/* Help Section */}
      <div className="flex-1 px-6 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Troubleshooting
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-3 py-4 border-b border-white/5">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-sm">📱</div>
            <span className="text-sm text-gray-400">Check your phone number is correct</span>
          </div>
          <div className="flex items-center gap-3 py-4 border-b border-white/5">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-sm">📩</div>
            <span className="text-sm text-gray-400">Check spam/junk folders</span>
          </div>
          <div className="flex items-center gap-3 py-4 border-b border-white/5">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-sm">📶</div>
            <span className="text-sm text-gray-400">Ensure you have signal</span>
          </div>
        </div>
      </div>

      {/* Keyboard Hint */}
      <div className="p-6 text-center">
        <p className="text-sm text-gray-500">
          Tip: You can <span className="inline-block px-2 py-1 bg-white/5 rounded text-xs font-mono mx-1">paste</span> the full code
        </p>
      </div>
    </div>
  );
};
