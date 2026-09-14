import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  BookOpen,
  FolderGit2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Skill, SkillLearningSession, Project } from '../../types';
import { calculateSkillMastery } from '../../utils/progressEngine';
import { ProgressBar } from '../common/ProgressBar';

interface SkillMasteryEvidenceCardProps {
  skill: Skill;
  sessions: SkillLearningSession[];
  projects: Project[];
  onLogPracticeClick: () => void;
}

export const SkillMasteryEvidenceCard: React.FC<SkillMasteryEvidenceCardProps> = ({
  skill,
  sessions,
  projects,
  onLogPracticeClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const mastery = calculateSkillMastery(skill, sessions, projects);
  const { breakdown, evidence, masteryInfo } = mastery;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 shadow-ambient-sm">
      {/* Top Banner: Current Rank & Evidence Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
              {masteryInfo.label}
            </span>
            <span className="text-xs text-zinc-400">
              Evidence-Backed Mastery Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl">
            {masteryInfo.description}
          </p>
        </div>

        {/* Big Percentage Display */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-3xl font-bold font-mono tracking-tight text-zinc-100">
              {mastery.percentage}%
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
              Composite Score
            </div>
          </div>
        </div>
      </div>

      {/* Main Overall Progress Bar */}
      <ProgressBar
        percentage={mastery.percentage}
        status={mastery.status}
        label="Overall Mastery Index"
        sublabel={`${mastery.hasMeasurableData ? `${mastery.value}/100 pts` : 'No verified evidence yet'}`}
        size="md"
      />

      {/* Four Evidence Pillars Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {/* Pillar 1: Syllabus */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium text-[11px]">Syllabus Depth</span>
            </div>
            <span className="font-mono text-zinc-400 text-[11px]">{breakdown.topicCompletion.score}%</span>
          </div>
          <ProgressBar
            percentage={breakdown.topicCompletion.score}
            size="xs"
            showPercentage={false}
          />
          <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
            <span>{breakdown.topicCompletion.completedTopics}/{breakdown.topicCompletion.totalTopics} topics</span>
            <span>35% weight</span>
          </div>
        </div>

        {/* Pillar 2: Practice Volume */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium text-[11px]">Deliberate Practice</span>
            </div>
            <span className="font-mono text-zinc-400 text-[11px]">{breakdown.practiceVolume.score}%</span>
          </div>
          <ProgressBar
            percentage={breakdown.practiceVolume.score}
            size="xs"
            showPercentage={false}
          />
          <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
            <span>{breakdown.practiceVolume.hoursLogged}h logged · {breakdown.practiceVolume.sessionsCount} sessions</span>
            <span>30% weight</span>
          </div>
        </div>

        {/* Pillar 3: Real Projects */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <FolderGit2 className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium text-[11px]">Practical Projects</span>
            </div>
            <span className="font-mono text-zinc-400 text-[11px]">{breakdown.projectApplication.score}%</span>
          </div>
          <ProgressBar
            percentage={breakdown.projectApplication.score}
            size="xs"
            showPercentage={false}
          />
          <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
            <span>{breakdown.projectApplication.completedCount}/{breakdown.projectApplication.totalCount} completed</span>
            <span>20% weight</span>
          </div>
        </div>

        {/* Pillar 4: Retention */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium text-[11px]">Retention Checks</span>
            </div>
            <span className="font-mono text-zinc-400 text-[11px]">{breakdown.knowledgeRetention.score}%</span>
          </div>
          <ProgressBar
            percentage={breakdown.knowledgeRetention.score}
            size="xs"
            showPercentage={false}
          />
          <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
            <span>{breakdown.knowledgeRetention.checksPassed} checks · {breakdown.knowledgeRetention.confidenceScore}/5 conf</span>
            <span>15% weight</span>
          </div>
        </div>
      </div>

      {/* Toggle Detailed Evidence & Next Tier Requirements */}
      <div className="pt-1 border-t border-zinc-800/60 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <span>{isExpanded ? 'Hide' : 'Inspect'} Verified Evidence & Criteria</span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          onClick={onLogPracticeClick}
          className="text-xs font-medium text-zinc-300 hover:text-white underline"
        >
          + Log New Evidence / Practice
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          {/* Positive Evidence Achieved */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Evidence Recorded:</span>
            </div>
            {evidence.positive.length > 0 ? (
              <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                {evidence.positive.map((ev, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400/80 mt-0.5">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-[11px]">
                No verified evidence logged yet. Complete topics and log practice sessions to build evidence.
              </p>
            )}
          </div>

          {/* Missing Criteria for Next Rank */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>Requirements for Next Mastery Tier:</span>
            </div>
            {evidence.needsImprovement.length > 0 ? (
              <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                {evidence.needsImprovement.map((req, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400/80 mt-0.5">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-emerald-400/90 text-[11px]">
                Outstanding! All tier requirements satisfied for this stage.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
