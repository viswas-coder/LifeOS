import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Star,
  GraduationCap,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { generateWeeklyReviewAI } from '../services/aiService';

export const AnalyticsView: React.FC = () => {
  const { tasks, skills, learningSessions, wins, projects } = useLifeOS();

  const [weeklyReviewData, setWeeklyReviewData] = useState<{
    summary: string;
    whatWentWell: string[];
    whatNeedsAttention: string[];
    recommendedPriorities: string[];
  } | null>(null);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);

  // Statistics
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const totalPracticeHours = (
    skills.reduce((acc, s) => acc + s.totalPracticeMinutes, 0) / 60
  ).toFixed(1);
  const avgSessionRating = (
    learningSessions.reduce((acc, s) => acc + (s.rating?.overallScore || 7.5), 0) /
    (learningSessions.length || 1)
  ).toFixed(1);

  const handleGenerateWeeklyReview = async () => {
    setIsGeneratingReview(true);
    try {
      const res = await generateWeeklyReviewAI(tasks, skills, projects, learningSessions);
      setWeeklyReviewData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.06]">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Analytics & Reviews</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Quantitative tracking of skill progression, practice time, task completion velocity, and weekly AI syntheses.
        </p>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="surface-card rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Completed Tasks</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-neutral-500" />
          </div>
          <div className="text-2xl font-light font-mono text-neutral-100">{completedTasks.length}</div>
          <p className="text-[10px] text-neutral-500 font-mono">of {tasks.length} total tasks</p>
        </div>

        <div className="surface-card rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Practice Time</span>
            <Clock className="h-3.5 w-3.5 text-neutral-500" />
          </div>
          <div className="text-2xl font-light font-mono text-neutral-100">{totalPracticeHours} hrs</div>
          <p className="text-[10px] text-neutral-500 font-mono">across {skills.length} skills</p>
        </div>

        <div className="surface-card rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Avg Session Score</span>
            <Star className="h-3.5 w-3.5 text-neutral-500" />
          </div>
          <div className="text-2xl font-light font-mono text-neutral-100">{avgSessionRating} <span className="text-xs text-neutral-500 font-normal">/ 10</span></div>
          <p className="text-[10px] text-neutral-500 font-mono">{learningSessions.length} logged sessions</p>
        </div>

        <div className="surface-card rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Recorded Wins</span>
            <Award className="h-3.5 w-3.5 text-neutral-500" />
          </div>
          <div className="text-2xl font-light font-mono text-neutral-100">{wins.length}</div>
          <p className="text-[10px] text-neutral-500 font-mono">breakthroughs & milestones</p>
        </div>
      </div>

      {/* Skill Mastery Breakdown */}
      <div className="surface-card rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
            <GraduationCap className="h-4 w-4 text-neutral-400" />
            <h3>Skill Mastery Spectrum</h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">Progression to 100%</span>
        </div>

        <div className="space-y-4">
          {skills.map(skill => (
            <div key={skill.id} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-200 font-medium">{skill.name}</span>
                <span className="font-mono text-neutral-400">{skill.currentMastery}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-neutral-300"
                  style={{
                    width: `${skill.currentMastery}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>State: <strong className="text-neutral-400 font-normal capitalize">{skill.state}</strong></span>
                <span>{skill.totalPracticeMinutes}m logged</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly AI Synthesis */}
      <div className="surface-card rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-neutral-400" />
            <div>
              <h3 className="text-xs font-semibold text-neutral-200">Weekly Momentum Synthesis</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">AI analysis of execution velocity, learning depth, and bottlenecks</p>
            </div>
          </div>

          <button
            onClick={handleGenerateWeeklyReview}
            disabled={isGeneratingReview}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white px-3 py-1.5 text-xs font-medium text-neutral-950 transition-all shadow-ambient-sm disabled:opacity-40"
          >
            {isGeneratingReview ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                <span>Generate Weekly Review</span>
              </>
            )}
          </button>
        </div>

        {weeklyReviewData ? (
          <div className="rounded-lg border border-white/[0.06] bg-[#0c0d12] p-4 text-xs text-neutral-300 leading-relaxed space-y-4">
            <p className="text-xs font-normal text-neutral-200">{weeklyReviewData.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  What Went Well
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-[11px] text-neutral-400">
                  {weeklyReviewData.whatWentWell.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Needs Attention
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-[11px] text-neutral-400">
                  {weeklyReviewData.whatNeedsAttention.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Recommended Focus
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-[11px] text-neutral-400">
                  {weeklyReviewData.recommendedPriorities.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/[0.06] p-8 text-center text-xs text-neutral-500">
            Click "Generate Weekly Review" to create an AI synthesis of your weekly accomplishments, mastery gains, and next steps.
          </div>
        )}
      </div>
    </div>
  );
};
