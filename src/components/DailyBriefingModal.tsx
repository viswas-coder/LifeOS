import React from 'react';
import {
  SunMedium,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  Zap,
  X,
  ArrowRight,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';

interface DailyBriefingModalProps {
  onNavigateToTasks: () => void;
  onNavigateToSkills: () => void;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  onNavigateToTasks,
  onNavigateToSkills,
}) => {
  const {
    isDailyBriefingOpen,
    setIsDailyBriefingOpen,
    profile,
    tasks,
    skills,
    projects,
    startMomentumMode,
  } = useLifeOS();

  if (!isDailyBriefingOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => t.dueDate === todayStr && t.status !== 'completed');
  const urgentTask = tasks.find(t => t.priority === 'urgent' && t.status !== 'completed') || todayTasks[0];
  const primarySkill = skills[0];
  const nextTopic = primarySkill?.domains[0]?.topics.find(t => t.state !== 'completed') || primarySkill?.domains[0]?.topics[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#0e1015] p-6 shadow-ambient-lg space-y-5 relative select-none">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-white/[0.06] pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Daily Briefing
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-100">
              Good morning, {profile.name}
            </h2>
            <p className="text-xs text-neutral-400">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <button
            onClick={() => setIsDailyBriefingOpen(false)}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1. Core Priority */}
        {urgentTask && (
          <div className="surface-card rounded-lg p-3.5 space-y-2 border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Priority Target
            </span>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold text-neutral-100">{urgentTask.title}</h4>
                {urgentTask.description && (
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{urgentTask.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setIsDailyBriefingOpen(false);
                  startMomentumMode(urgentTask);
                }}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-950 hover:bg-white shadow-ambient-sm whitespace-nowrap flex items-center gap-1 transition-all"
              >
                <Zap className="h-3 w-3 fill-current" />
                <span>Focus</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Today's Learning Recommendation */}
        {primarySkill && nextTopic && (
          <div className="surface-card rounded-lg p-3.5 space-y-1.5 border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Skill Target
              </span>
              <span className="text-[11px] font-mono text-neutral-500">{primarySkill.name}</span>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-neutral-200">{nextTopic.name}</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{nextTopic.description}</p>
            </div>
          </div>
        )}

        {/* 3. Snapshot Metrics */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="surface-card rounded-lg p-2.5 space-y-0.5">
            <div className="text-lg font-light font-mono text-neutral-100">{todayTasks.length}</div>
            <div className="text-[10px] font-mono text-neutral-500">Tasks Due</div>
          </div>
          <div className="surface-card rounded-lg p-2.5 space-y-0.5">
            <div className="text-lg font-light font-mono text-neutral-100">{profile.targetFocusHoursPerDay || 4}h</div>
            <div className="text-[10px] font-mono text-neutral-500">Deep Work Goal</div>
          </div>
          <div className="surface-card rounded-lg p-2.5 space-y-0.5">
            <div className="text-lg font-light font-mono text-neutral-100">{skills.length}</div>
            <div className="text-[10px] font-mono text-neutral-500">Active Tracks</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={() => setIsDailyBriefingOpen(false)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-950 transition-all shadow-ambient-sm"
          >
            <span>Begin Day</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
