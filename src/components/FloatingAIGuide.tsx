import React from 'react';
import {
  Compass,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Circle,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';

export const FloatingAIGuide: React.FC = () => {
  const {
    floatingGuide,
    setFloatingGuide,
    advanceFloatingGuideStep,
    closeFloatingGuide,
    startMomentumMode,
    tasks,
  } = useLifeOS();

  if (!floatingGuide.isOpen) return null;

  const activeTask = tasks.find(t => t.id === floatingGuide.taskId);

  return (
    <div
      id="floating-ai-guide"
      className="fixed bottom-6 right-6 z-40 w-80 sm:w-88 rounded-xl border border-white/[0.08] bg-[#0e1015]/95 shadow-ambient-lg backdrop-blur-xl transition-all select-none overflow-hidden"
    >
      {/* Guide Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.04] text-neutral-400 border border-white/[0.06]">
            <Compass className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-neutral-200">Momentum Guide</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setFloatingGuide({ isMinimized: !floatingGuide.isMinimized })}
            className="p-1 rounded hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-colors"
            title={floatingGuide.isMinimized ? 'Expand guide' : 'Minimize guide'}
          >
            {floatingGuide.isMinimized ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={closeFloatingGuide}
            className="p-1 rounded hover:bg-white/[0.05] text-neutral-400 hover:text-rose-400 transition-colors"
            title="Close guide"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Guide Body (if not minimized) */}
      {!floatingGuide.isMinimized && (
        <div className="p-3.5 space-y-3">
          {/* Current Focus Target */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Active Focus
            </span>
            <h4 className="text-xs font-semibold text-neutral-100 leading-snug mt-0.5">
              {floatingGuide.currentFocusTitle}
            </h4>
          </div>

          {/* Micro-steps Progress */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span>Steps</span>
              <span>
                {floatingGuide.steps.filter(s => s.completed).length} / {floatingGuide.steps.length}
              </span>
            </div>

            <div className="space-y-1">
              {floatingGuide.steps.map((step, idx) => {
                const isCurrent = idx === floatingGuide.currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-2 rounded-lg p-2 text-xs transition-all ${
                      isCurrent
                        ? 'border border-white/[0.1] bg-white/[0.04] text-neutral-100 font-medium'
                        : step.completed
                        ? 'text-neutral-500 line-through'
                        : 'text-neutral-400'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-neutral-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Coaching Tip */}
          {floatingGuide.aiCoachingTip && (
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 text-xs text-neutral-400 flex items-start gap-2">
              <Sparkles className="h-3 w-3 text-neutral-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px] italic">"{floatingGuide.aiCoachingTip}"</p>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <button
              onClick={() => startMomentumMode(activeTask)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] px-2.5 py-1 text-xs text-neutral-300 transition-colors"
            >
              <Zap className="h-3 w-3 text-neutral-400" />
              <span>Focus Mode</span>
            </button>

            <button
              onClick={advanceFloatingGuideStep}
              className="flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-white px-2.5 py-1 text-xs font-medium text-neutral-950 transition-all"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Next Step</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
