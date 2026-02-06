import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings } from 'lucide-react';

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
    { path: '/estimates', icon: FileText, label: 'Estimates' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Page Content */}
      <main className="animate-fade-in-up">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="nav-bar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center gap-1 px-4 py-2 rounded-xl
                transition-all duration-300 touch-target
                ${isActive 
                  ? 'text-white bg-blue-500/20' 
                  : 'text-slate-500 hover:text-slate-300'
                }
              `}
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-300 ${isActive ? 'scale-110' : ''}`}
              />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
