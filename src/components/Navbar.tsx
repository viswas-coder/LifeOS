import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Compass,
  Zap,
  Sparkles,
  Menu,
  SunMedium,
  CheckCircle2,
  ChevronLeft,
  StickyNote as StickyNoteIcon,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
  title?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  backLabel?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  title,
  canGoBack,
  onBack,
  backLabel,
}) => {
  const {
    setIsSearchOpen,
    setIsQuickAddOpen,
    setIsDailyBriefingOpen,
    startMomentumMode,
    floatingGuide,
    setFloatingGuide,
    stickyNotes,
    updateStickyNote,
    openDailyProgressStickyNote,
  } = useLifeOS();

  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setCurrentDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      id="main-navbar"
      className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 sm:px-6 backdrop-blur-md z-20"
    >
      {/* Left: Mobile Menu, Back Button & Breadcrumbs */}
      <div className="flex items-center gap-2.5">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-850 hover:text-white"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {canGoBack && onBack && (
          <button
            id="nav-back-button"
            onClick={onBack}
            className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/90 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{backLabel || 'Back'}</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-xs">
          {canGoBack && (
            <>
              <span className="text-zinc-500 font-medium">Dashboard</span>
              <span className="text-zinc-600">/</span>
            </>
          )}
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
            {title || 'LifeOS AI'}
          </h1>
        </div>
      </div>

      {/* Center: Universal Search trigger */}
      <div className="flex-1 max-w-md mx-4">
        <button
          id="btn-global-search"
          onClick={() => setIsSearchOpen(true)}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-zinc-500" />
            <span className="truncate">Search tasks, skills, projects, ideas...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 border border-zinc-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Time Widget */}
        <div className="hidden xl:flex flex-col items-end text-right mr-1.5 select-none">
          <span className="text-xs font-medium text-zinc-300 font-mono tracking-tight">{currentTimeStr}</span>
          <span className="text-[10px] text-zinc-500 font-medium">{currentDateStr}</span>
        </div>

        {/* Daily Briefing */}
        <button
          id="btn-daily-briefing"
          onClick={() => setIsDailyBriefingOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-750 bg-zinc-850 hover:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
          title="Open Daily Morning Briefing"
        >
          <SunMedium className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden md:inline">Briefing</span>
        </button>

        {/* AI Guide Toggle */}
        <button
          id="btn-toggle-floating-guide"
          onClick={() => setFloatingGuide({ isOpen: !floatingGuide.isOpen, isMinimized: false })}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
            floatingGuide.isOpen
              ? 'border-zinc-700 bg-zinc-800 text-zinc-100 shadow-sm'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
          }`}
          title="Toggle Floating AI Guide"
        >
          <Compass className="h-3.5 w-3.5" />
          <span className="hidden md:inline">AI Guide</span>
        </button>

        {/* Floating Sticky Note Toggle */}
        <button
          id="btn-toggle-floating-note"
          onClick={() => {
            const activeFloating = stickyNotes.find(n => n.isFloatingOpen);
            if (activeFloating) {
              updateStickyNote(activeFloating.id, { isFloatingOpen: !activeFloating.isFloatingOpen });
            } else {
              openDailyProgressStickyNote();
            }
          }}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
            stickyNotes.some(n => n.isFloatingOpen)
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-sm'
              : 'border-zinc-750 bg-zinc-850 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
          }`}
          title="Toggle Floating Sticky Note (Tracks daily tasks & progress, floats across tabs via PiP)"
        >
          <StickyNoteIcon className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Sticky Note</span>
        </button>

        {/* Momentum Mode */}
        <button
          id="btn-momentum-mode"
          onClick={() => startMomentumMode()}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-750 bg-zinc-850 hover:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
          title="Launch Minimalist Momentum Execution Mode"
        >
          <Zap className="h-3.5 w-3.5 text-zinc-300" />
          <span>Focus</span>
        </button>

        {/* Quick Add Button */}
        <button
          id="btn-quick-add"
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-200 hover:bg-white text-zinc-950 px-2.5 py-1.5 text-xs font-medium transition-all shadow-sm active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </header>
  );
};
