import { useAuthStore } from '../stores/authStore';
import { Clock, RefreshCw, LogOut } from 'lucide-react';

export const ApprovalPending = () => {
  const { user, logout } = useAuthStore();

  const handleCheckStatus = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mb-8 animate-pulse">
          <Clock className="text-amber-400 w-12 h-12" />
        </div>

        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-white mb-3">
            Account Pending Approval
          </h1>
          <p className="text-slate-400 text-base max-w-md leading-relaxed">
            Your account has been created but requires administrator approval before you can access the system.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-700/60 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Your Account
                </p>
                <p className="text-lg font-semibold text-white">
                  {user?.phoneNumber}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-semibold text-amber-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Pending Review
              </span>
              <span className="px-3 py-1.5 bg-slate-700/60 border border-slate-600/50 rounded-full text-xs font-medium text-slate-400">
                Submitted Today
              </span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 text-xl flex-shrink-0">ℹ️</span>
              <div>
                <p className="text-sm text-blue-300 leading-relaxed mb-2">
                  You'll receive an SMS notification once approved.
                </p>
                <p className="text-xs text-blue-400/70">
                  Typically completed within 24 hours
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-xl flex-shrink-0">⏳</span>
              <div>
                <p className="text-sm text-amber-300 leading-relaxed mb-1">
                  <strong>In the queue</strong>
                </p>
                <p className="text-xs text-amber-400/70">
                  An administrator will review your request shortly
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={handleCheckStatus}
            className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Check Status</span>
          </button>
          <button
            onClick={logout}
            className="w-full bg-transparent border-2 border-slate-700 text-slate-300 font-semibold py-4 rounded-xl hover:bg-slate-800/60 hover:border-slate-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-slate-500 mb-2">
            Questions about your application?
          </p>
          <a 
            href="mailto:admin@pinpointpainting.com" 
            className="text-slate-400 hover:text-white transition-colors font-medium"
          >
            admin@pinpointpainting.com
          </a>
        </div>
      </div>
    </div>
  );
};
