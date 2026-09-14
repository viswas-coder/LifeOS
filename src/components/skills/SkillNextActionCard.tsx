import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Clock, RefreshCw, Zap, Lightbulb, Compass } from 'lucide-react';
import { Skill, Project, Goal } from '../../types';
import { getSkillNextAction } from '../../services/aiService';

interface SkillNextActionCardProps {
  skill: Skill;
  projects: Project[];
  goals: Goal[];
  onStartSessionForTopic: (topicName: string, prompt?: string) => void;
}

export const SkillNextActionCard: React.FC<SkillNextActionCardProps> = ({
  skill,
  projects,
  goals,
  onStartSessionForTopic,
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    topicName: string;
    domainName: string;
    why: string;
    estimatedMinutes: number;
    actionType: string;
    challengePrompt: string;
    stagnationNote?: string;
    alternatives?: { title: string; description: string; minutes: number }[];
  } | null>(null);

  const fetchAction = async () => {
    setLoading(true);
    try {
      const data = await getSkillNextAction(skill, 45, projects, goals);
      setRecommendation(data);
    } catch (err) {
      console.error('Failed to get next action', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAction();
  }, [skill.id]);

  if (loading && !recommendation) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4.5 space-y-2 animate-pulse">
        <div className="h-4 w-48 bg-zinc-800 rounded" />
        <div className="h-3 w-full bg-zinc-800/60 rounded" />
        <div className="h-3 w-3/4 bg-zinc-800/60 rounded" />
      </div>
    );
  }

  if (!recommendation) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-4.5 space-y-3.5 shadow-ambient-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-zinc-200" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
              AI Next Mastery Target
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-100">{recommendation.topicName}</span>
              <span className="text-[10px] text-zinc-500 font-mono">in {recommendation.domainName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded bg-zinc-800/90 px-2 py-0.5 text-[10px] font-mono text-zinc-300 border border-zinc-750">
            <Clock className="h-3 w-3 text-zinc-400" />
            {recommendation.estimatedMinutes}m
          </span>
          <button
            onClick={fetchAction}
            disabled={loading}
            title="Refresh recommendation"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Why & Challenge */}
      <p className="text-xs text-zinc-300 leading-relaxed">
        {recommendation.why}
      </p>

      {recommendation.challengePrompt && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300">
            <Zap className="h-3 w-3 text-zinc-400" />
            <span>Target Practice Challenge:</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-normal font-sans">
            {recommendation.challengePrompt}
          </p>
        </div>
      )}

      {/* Action footer */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() =>
            onStartSessionForTopic(
              recommendation.topicName,
              recommendation.challengePrompt
            )
          }
          className="flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1.5 text-xs font-medium transition-all shadow-sm group"
        >
          <span>Start Practice Session</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {recommendation.alternatives && recommendation.alternatives.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span>Or quick alternative:</span>
            <button
              onClick={() =>
                onStartSessionForTopic(
                  recommendation.alternatives![0].title,
                  recommendation.alternatives![0].description
                )
              }
              className="text-zinc-300 underline hover:text-zinc-100 truncate max-w-[200px]"
            >
              {recommendation.alternatives[0].title} ({recommendation.alternatives[0].minutes}m)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
