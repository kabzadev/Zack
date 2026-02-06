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
      <div className="flex-1 flex flex-col justify-center px-6 pt-12 pb-8">
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-[0_10px_40px_rgba(255,255,255,0.15)]">
              <span className="text-slate-900 text-4xl font-bold">◆</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-3">
            Pinpoint Painting
          </h1>
          <p className="text-slate-300 text-lg mb-3">
            Professional Estimating
          </p>
          <span className="inline-block px-4 py-2 bg-slate-800/60 backdrop-blur-sm rounded-full text-xs font-semibold text-slate-300 uppercase tracking-wider border border-slate-700/50">
            Crew Login
          </span>
        </div>
      </div>

      <div className="px-6 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Phone Number
            </label>

            <div className="flex gap-3">
              <div className="flex items-center gap-3 px-4 py-4 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50">
                <span className="text-2xl">🇺🇸</span>
                <span className="text-white font-semibold text-lg">+1</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(XXX) XXX-XXXX"
                className="flex-1 px-4 py-4 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white text-lg text-center tracking-wider placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm animate-fade-in-up">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-5">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
              <span className="text-slate-300 font-medium">Sending code...</span>
            </div>
          ) : (
            <button
              type="submit"
              disabled={phoneNumber.replace(/\D/g, '').length !== 10}
              className="w-full bg-white text-slate-900 font-bold py-5 rounded-xl text-lg hover:bg-slate-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100 shadow-lg"
            >
              Continue
            </button>
          )}
        </form>

        <div className="mt-8 space-y-3">
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl backdrop-blur-sm">
            <span className="text-xl flex-shrink-0">🔒</span>
            <p className="text-sm text-blue-300 leading-relaxed">
              We'll send a 6-digit verification code via SMS. Standard messaging rates may apply.
            </p>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl backdrop-blur-sm">
            <span className="text-xl flex-shrink-0">⏳</span>
            <p className="text-sm text-amber-300 leading-relaxed">
              First-time users require administrator approval before accessing the system.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 text-center border-t border-slate-800/50">
        <p className="text-sm text-slate-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-slate-400 hover:text-white underline transition-colors">Terms of Service</a>
          {' & '}
          <a href="#" className="text-slate-400 hover:text-white underline transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};
