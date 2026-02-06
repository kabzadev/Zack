import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  animationDelay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconColor = 'text-blue-400',
  iconBg = 'bg-blue-500/20',
  value,
  label,
  trend,
  onClick,
  animationDelay = 0,
}) => {
  const isClickable = !!onClick;

  return (
    <div
      className={`
        app-card
        ${isClickable ? 'app-card-hover cursor-pointer' : ''}
        animate-fade-in-up
      `}
      onClick={onClick}
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div className="flex items-start justify-between">
        {/* Left side - Icon and stats */}
        <div className="flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mb-4`}>
            {icon}
          </div>
          
          <div className="mb-1">
            <div className="text-3xl font-bold text-white truncate">
              {value}
            </div>
          </div>
          
          <div className="text-sm text-slate-400 truncate">
            {label}
          </div>
        </div>

        {/* Right side - Trend indicator */}
        {trend && (
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold
            ${trend.isPositive 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
            }
          `}>
            {trend.isPositive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
