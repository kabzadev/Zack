import { useAuthStore } from '../stores/authStore';
import { Clock } from 'lucide-react';

export const ApprovalPending = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-pinpoint-dark flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Status Icon */}
        <div className="w-20 h-20 rounded-full bg-amber-900/30 border-2 border-amber-600 flex items-center justify-center mb-6 animate-pulse">
          <Clock className="text-amber-400" size={40} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white text-center mb-3">
          Account Pending Approval
        </h1>
        <p className="text-gray-400 text-center max-w-sm mb-8">
          Your account has been created but requires administrator approval before you can access the system.
        </p>

        {/* User Card */}
        <div className="w-full max-w-sm bg-gray-800 rounded-xl border border-gray-700 p-5 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Your Info
          </p>
          <p className="text-lg font-semibold text-white mb-2">
            {user?.phoneNumber}
          </p>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-amber-900/30 border border-amber-700 rounded-full text-xs font-medium text-amber-400">
              Pending Review
            </span>
            <span className="px-3 py-1 bg-gray-700 rounded-full text-xs font-medium text-gray-400">
              Submitted Today
            </span>
          </div>
        </div>

        {/* Queue Info */}
        <div className="w-full max-w-sm bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 text-xl">ℹ️</span>
            <p className="text-sm text-blue-300">
              You'll receive an SMS notification once approved. Typically completed within 24 hours.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white text-pinpoint-dark font-semibold py-4 rounded-lg hover:bg-gray-100 transition-all active:scale-95"
          >
            Check Status
          </button>
          <button
            onClick={logout}
            className="w-full bg-transparent border border-gray-600 text-gray-400 font-semibold py-4 rounded-lg hover:bg-gray-800 transition-all"
          >
            Sign Out
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Questions? Contact{' '}
            <a href="mailto:admin@pinpointpainting.com" className="text-gray-400 hover:text-white">
              admin@pinpointpainting.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};