import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Phone, AlertCircle, Loader2 } from 'lucide-react';

export const PhoneLogin = () => {
  const navigate = useNavigate();
  const { requestOTP, setTempPhoneNumber } = useAuthStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Apply formatting: (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
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
    <div className="min-h-screen bg-pinpoint-dark flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pinpoint-navy rounded-xl mb-6">
            <span className="text-white text-3xl font-bold">◆</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Pinpoint Painting</h1>
          <p className="text-gray-400">Sign in with your phone number</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-lg text-white border border-gray-700">
                <span className="text-lg">🇺🇸</span>
                <span className="font-medium">+1</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(XXX) XXX-XXXX"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-pinpoint-blue focus:border-transparent outline-none transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || phoneNumber.replace(/\D/g, '').length !== 10}
            className="w-full bg-white text-pinpoint-dark font-semibold py-4 rounded-lg hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Phone size={20} />
                Continue
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-8 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
            <span className="text-blue-400 text-lg">🔒</span>
            <p className="text-sm text-blue-300">
              We'll send a 6-digit verification code via SMS. Standard messaging rates may apply.
            </p>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-amber-900/20 border border-amber-800 rounded-lg">
            <span className="text-amber-400 text-lg">⚠️</span>
            <p className="text-sm text-amber-300">
              First-time users require administrator approval before accessing the system.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-sm text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};