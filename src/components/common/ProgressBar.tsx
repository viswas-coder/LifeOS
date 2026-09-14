import React from 'react';
import { ProgressState } from '../../utils/progressEngine';

interface ProgressBarProps {
  percentage: number;
  status?: ProgressState;
  label?: string;
  sublabel?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  hasData?: boolean;
  emptyText?: string;
  className?: string;
  barClassName?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  status,
  label,
  sublabel,
  size = 'md',
  showPercentage = true,
  hasData = true,
  emptyText = 'No progress yet',
  className = '',
  barClassName = '',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  // Color selection based on progress/mastery state
  const getFillColor = () => {
    if (!hasData || clamped === 0) return 'bg-zinc-700/50';
    if (status === 'mastered' || clamped === 100) return 'bg-zinc-100';
    if (status === 'near_completion' || clamped >= 80) return 'bg-zinc-200';
    if (clamped >= 40) return 'bg-zinc-300';
    return 'bg-zinc-400';
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercentage || sublabel) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {label && (
              <span className="truncate font-medium text-zinc-300 text-[11px] sm:text-xs">
                {label}
              </span>
            )}
            {sublabel && (
              <span className="truncate text-[10px] text-zinc-400 font-mono hidden sm:inline">
                {sublabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
            {hasData ? (
              showPercentage && (
                <span className="font-semibold text-zinc-200">
                  {clamped}%
                </span>
              )
            ) : (
              <span className="text-zinc-400 text-[10px] uppercase font-sans tracking-wide">
                {emptyText}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress Track */}
      <div
        role="progressbar"
        aria-valuenow={hasData ? clamped : 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className={`w-full overflow-hidden rounded-full bg-zinc-800/80 border border-zinc-750/60 ${sizeClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getFillColor()} ${barClassName}`}
          style={{ width: hasData ? `${clamped}%` : '0%' }}
        />
      </div>

      {sublabel && (
        <div className="text-[10px] text-zinc-400 font-mono sm:hidden">
          {sublabel}
        </div>
      )}
    </div>
  );
};
