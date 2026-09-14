import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Circle,
  X,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';

export const MomentumModeOverlay: React.FC = () => {
  const {
    isMomentumModeOpen,
    exitMomentumMode,
    activeFocusSession,
    tasks,
    toggleTaskComplete,
    addDailyWin,
    addStickyNote,
  } = useLifeOS();

  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [scratchpadText, setScratchpadText] = useState('');

  // Target task
  const targetTask = tasks.find(t => t.id === activeFocusSession?.taskId) || tasks[0];

  useEffect(() => {
    if (isMomentumModeOpen && activeFocusSession?.durationMinutes) {
      setSecondsLeft(activeFocusSession.durationMinutes * 60);
      setIsRunning(true);
    }
  }, [isMomentumModeOpen, activeFocusSession]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  if (!isMomentumModeOpen || !targetTask) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCompleteTask = () => {
    toggleTaskComplete(targetTask.id);
    addDailyWin(`Completed focus sprint on: ${targetTask.title}`, 'accomplishment');
    exitMomentumMode();
  };

  const handleSaveScratchpadToSticky = () => {
    if (!scratchpadText.trim()) return;
    addStickyNote({
      title: 'Focus Sprint Thought',
      content: scratchpadText.trim(),
      color: '#FEF08A',
      isPinned: false,
      isCollapsed: false,
      opacity: 1,
      position: { x: 50, y: 150 },
      size: { width: 260, height: 180 },
      isFloatingOpen: false,
    });
    setScratchpadText('');
  };

  return (
    <div
      id="momentum-mode-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#08090c]/98 p-6 sm:p-12 text-white backdrop-blur-2xl select-none"
    >
      {/* Top Bar */}
      <div className="flex w-full max-w-3xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] text-neutral-400 border border-white/[0.06]">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            Momentum Focus
          </span>
        </div>

        <button
          onClick={exitMomentumMode}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          <span>Exit Focus</span>
        </button>
      </div>

      {/* Main Focus Centerpiece */}
      <div className="flex flex-col items-center text-center max-w-xl w-full space-y-7 my-auto">
        {/* Task Title */}
        <div className="space-y-2">
          <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-neutral-400 border border-white/[0.06]">
            Single-Task Target
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100 leading-tight">
            {targetTask.title}
          </h2>
          {targetTask.description && (
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">{targetTask.description}</p>
          )}
        </div>

        {/* Large Minimal Timer */}
        <div className="space-y-4">
          <div className="text-6xl sm:text-8xl font-light font-mono tracking-tight text-neutral-100">
            {timeFormatted}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 rounded-lg bg-neutral-100 px-5 py-2 text-xs font-medium text-neutral-950 hover:bg-white transition-all shadow-ambient-sm active:scale-95"
            >
              {isRunning ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              <span>{isRunning ? 'Pause' : 'Resume'}</span>
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(25 * 60);
              }}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2 text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setSecondsLeft(prev => prev + 5 * 60)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-xs font-mono text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors"
            >
              +5m
            </button>
          </div>
        </div>

        {/* AI Coaching Whisper */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs text-neutral-400 flex items-center gap-2 max-w-md">
          <Sparkles className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          <span className="italic text-[11px]">
            "Eliminate secondary tabs. Focus solely on completing this module before moving on."
          </span>
        </div>

        {/* Fast Brain-Dump Scratchpad */}
        <div className="w-full max-w-md surface-card rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>Distraction Dump</span>
            {scratchpadText && (
              <button
                onClick={handleSaveScratchpadToSticky}
                className="text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3 w-3" /> Save to Note
              </button>
            )}
          </div>
          <input
            type="text"
            value={scratchpadText}
            onChange={e => setScratchpadText(e.target.value)}
            placeholder="Jot down a fleeting thought so you don't lose focus..."
            className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Bottom Completion Bar */}
      <div className="flex w-full max-w-3xl items-center justify-between border-t border-white/[0.06] pt-4">
        <span className="text-[11px] text-neutral-500 font-mono">
          Esc to exit focus session
        </span>

        <button
          onClick={handleCompleteTask}
          className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Mark Task Complete & Exit</span>
        </button>
      </div>
    </div>
  );
};
