import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

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
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);
    setError('');

    // Move to next input if value entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (index === 5 && value) {
      const fullCode = [...newCode.slice(0, 5), value].join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
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
    // TODO: Implement resend logic
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
      {/* Header */}
      <div className="p-4">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-gray-400 mb-2">We sent a code to</p>
          <p className="text-xl font-semibold text-white">{tempPhoneNumber}</p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
            Enter 6-digit code
          </label>
          <div className="flex justify-center gap-3" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className={`w-12 h-14 text-center text-2xl font-bold bg-gray-800 border-2 rounded-lg 
                  ${digit ? 'border-pinpoint-blue bg-gray-700' : 'border-gray-700'} 
                  ${error ? 'border-red-500' : ''}
                  text-white focus:border-pinpoint-blue focus:outline-none transition-all`}
              />
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400">
            Code expires in <span className="text-gray-300 font-medium">{formatCountdown(countdown)}</span>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg mb-6">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Resend */}
        <div className="text-center mb-8">
          {canResend ? (
            <button
              onClick={handleResend}
              className="flex items-center gap-2 text-pinpoint-blue hover:text-blue-400 font-medium mx-auto transition-colors"
            >
              <RefreshCw size={16} />
              Resend code
            </button>
          ) : (
            <p className="text-gray-500">
              Didn't receive it? <span className="text-gray-400">Wait {countdown}s to resend</span>
            </p>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Troubleshooting
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">📱</div>
              <span>Check your phone number is correct</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">📩</div>
              <span>Check spam/junk folders</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">📶</div>
              <span>Ensure you have signal</span>
            </div>
          </div>
        </div>

        {/* Tip */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Tip: You can paste the full code
        </p>
      </div>

      {/* Verify Button (for accessibility) */}
      <div className="p-6">
        <button
          onClick={() => handleVerify(code.join(''))}
          disabled={isLoading || code.some(d => !d)}
          className="w-full bg-white text-pinpoint-dark font-semibold py-4 rounded-lg hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            'Verify'
          )}
        </button>
      </div>
    </div>
  );
};