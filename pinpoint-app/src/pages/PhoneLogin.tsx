import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const PhoneLogin = () => {
  const navigate = useNavigate();
  const { requestOTP, setTempPhoneNumber } = useAuthStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.replace(/\D/g, '').length <= 10) {
      setPhoneNumber(formatted);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await requestOTP(phoneNumber);
    
    if (result.success) {
      setTempPhoneNumber(phoneNumber);
      navigate('/verify');
    } else {
      setError(result.error || 'Failed to send code. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header / Logo Area */}
      <div className="flex-1 flex flex-col justify-center px-6 pt-12 pb-8">
        <div className="text-center animate-fade-in-up">
          {/* Logo */}
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(255,255,255,0.15)]">
              <span className="text-slate-900 text-3xl font-bold">◆</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-3">
            Pinpoint Painting
          </h1>
          <p className="text-slate-400 text-lg mb-2">
            Sign in with your phone
          </p>
          <span className="inline-block px-4 py-1.5 bg-slate-800/50 rounded-full text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Crew Login
          </span>
        </div>
      </div>

      {/* Form Area */}
      <div className="px-6 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Phone Input Label */}
          <label className="block text-sm font-semibold text-white">
            Enter your phone number
          </label>

          {/* Phone Input */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span className="text-2xl">🇺🇸</span>
              <span className="text-white font-medium text-lg">+1</span>
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="(XXX) XXX-XXXX"
              className="flex-1 input-field text-lg text-center tracking-wider"
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <span className="text-xl">⚠️</span>
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {/* Continue Button */}
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-5">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
              <span className="text-slate-400 font-medium">Sending code...</span>
            </div>
          ) : (
            <button
              type="submit"
              disabled={phoneNumber.replace(/\D/g, '').length !== 10}
              className="w-full btn-primary text-lg"
            >
              <span>Continue</span>
            </button>
          )}
        </form>

        {/* Info Boxes */}
        <div className="mt-8 space-y-3">
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <span className="text-xl flex-shrink-0">🔒</span>
            <p className="text-sm text-blue-300 leading-relaxed">
              We'll send a 6-digit verification code via SMS. Standard messaging rates may apply.
            </p>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <p className="text-sm text-amber-300 leading-relaxed">
              First-time users require administrator approval before accessing the system.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center border-t border-slate-800/50">
        <p className="text-sm text-slate-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-slate-400 hover:text-white underline transition-colors">Terms</a>
          {' & '}
          <a href="#" className="text-slate-400 hover:text-white underline transition-colors">Privacy</a>
        </p>
      </div>
    </div>
  );
};
