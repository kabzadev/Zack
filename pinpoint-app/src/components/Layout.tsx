import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, Mic } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  headerActions?: React.ReactNode;
  activeTab?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/voice-estimate', icon: Mic, label: 'Estimate', highlight: true },
    { path: '/estimates', icon: FileText, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Page Content */}
      <main className="animate-fade-in-up">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="nav-bar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);
          const isHighlight = item.highlight;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                transition-all duration-300 touch-target relative
                ${isHighlight && !isActive
                  ? 'text-blue-400'
                  : isActive 
                    ? 'text-white bg-blue-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }
              `}
            >
              {isHighlight ? (
                <div className={`w-11 h-11 -mt-5 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/40 scale-110' 
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/25'
                }`}>
                  <Icon size={22} strokeWidth={2.5} className="text-white" />
                </div>
              ) : (
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all duration-300 ${isActive ? 'scale-110' : ''}`}
                />
              )}
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''} ${isHighlight ? '-mt-0.5' : ''}`}>
                {item.label}
              </span>
              {isActive && !isHighlight && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
