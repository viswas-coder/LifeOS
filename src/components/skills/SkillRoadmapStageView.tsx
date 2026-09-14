import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  HelpCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  Zap,
  BookOpen,
  Trash2,
  Edit3,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Skill, SkillDomain, SkillTopic, SkillTopicState } from '../../types';
import { ProgressBar } from '../common/ProgressBar';

interface SkillRoadmapStageViewProps {
  skill: Skill;
  onUpdateTopicState: (topicId: string, state: SkillTopicState, masteryScore?: number) => void;
  onStartKnowledgeCheck: (topicName: string) => void;
  onAddCustomTopic: (domainId: string, name: string, description: string, prompt?: string) => void;
  onDeleteTopic: (domainId: string, topicId: string) => void;
  onSelectTopicForPractice: (topic: SkillTopic) => void;
}

const STAGES = [
  { id: 'all', label: 'Full Roadmap', desc: 'All domains & stages' },
  { id: 'foundations', label: '1. Foundations', desc: 'Syntax, terminology, mental models' },
  { id: 'core', label: '2. Core Mastery', desc: 'Key mechanics, idioms, common workflows' },
  { id: 'intermediate', label: '3. Intermediate', desc: 'Non-trivial implementation, edge cases' },
  { id: 'advanced', label: '4. Advanced', desc: 'Architecture, internal design, optimization' },
  { id: 'mastery', label: '5. Mastery', desc: 'Edge cases, synthesis, teaching others' },
];

export const SkillRoadmapStageView: React.FC<SkillRoadmapStageViewProps> = ({
  skill,
  onUpdateTopicState,
  onStartKnowledgeCheck,
  onAddCustomTopic,
  onDeleteTopic,
  onSelectTopicForPractice,
}) => {
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [expandedDomainId, setExpandedDomainId] = useState<string>(skill.domains[0]?.id || '');
  const [addTopicDomainId, setAddTopicDomainId] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicPrompt, setNewTopicPrompt] = useState('');

  // Map or filter domains by stage
  const filteredDomains = skill.domains.filter(domain => {
    if (activeStageFilter === 'all') return true;
    return domain.stage === activeStageFilter;
  });

  const handleCreateCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTopicDomainId || !newTopicName.trim()) return;
    onAddCustomTopic(
      addTopicDomainId,
      newTopicName.trim(),
      newTopicDesc.trim(),
      newTopicPrompt.trim() || undefined
    );
    setAddTopicDomainId(null);
    setNewTopicName('');
    setNewTopicDesc('');
    setNewTopicPrompt('');
  };

  const getTopicStateBadge = (state: SkillTopicState) => {
    switch (state) {
      case 'mastered':
        return { label: 'Mastered', style: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
      case 'completed':
        return { label: 'Completed', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'applied':
        return { label: 'Applied', style: 'bg-blue-500/10 text-blue-300 border-blue-500/20' };
      case 'understood':
        return { label: 'Understood', style: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' };
      case 'practicing':
        return { label: 'Practicing', style: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
      case 'learning':
        return { label: 'Learning', style: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
      default:
        return { label: 'Available', style: 'bg-zinc-850 text-zinc-400 border-zinc-750' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Stage Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-zinc-800">
        {STAGES.map(st => {
          const isSelected = activeStageFilter === st.id;
          const stageTopicsCount = skill.domains
            .filter(d => st.id === 'all' || d.stage === st.id)
            .flatMap(d => d.topics).length;

          return (
            <button
              key={st.id}
              onClick={() => setActiveStageFilter(st.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 text-xs rounded-t-lg font-medium transition-all ${
                isSelected
                  ? 'bg-zinc-800 text-zinc-100 border-b-2 border-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <span>{st.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400">
                {stageTopicsCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Domain Cards */}
      <div className="space-y-3">
        {filteredDomains.map((domain, dIdx) => {
          const isExpanded = expandedDomainId === domain.id;
          const completedTopics = domain.topics.filter(
            t => t.state === 'completed' || t.state === 'mastered'
          ).length;
          const domainPercent = domain.topics.length > 0
            ? Math.round((completedTopics / domain.topics.length) * 100)
            : 0;

          return (
            <div
              key={domain.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/90 overflow-hidden shadow-ambient-sm transition-all"
            >
              {/* Domain Header */}
              <div
                onClick={() => setExpandedDomainId(isExpanded ? '' : domain.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-850/60 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800 text-zinc-300 text-xs font-mono border border-zinc-700/60">
                    0{dIdx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-zinc-100">{domain.name}</h4>
                      {domain.stage && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[9px] font-mono text-zinc-400 uppercase tracking-wide">
                          {domain.stage}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">{domain.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <div className="w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-zinc-300 rounded-full transition-all duration-300"
                        style={{ width: `${domainPercent}%` }}
                      />
                    </div>
                    <span>{domainPercent}%</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Topics Body */}
              {isExpanded && (
                <div className="border-t border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
                    <span>{completedTopics} of {domain.topics.length} topics completed</span>
                    <button
                      onClick={() => setAddTopicDomainId(domain.id)}
                      className="flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Custom Topic</span>
                    </button>
                  </div>

                  {domain.topics.map(topic => {
                    const isDone = topic.state === 'completed' || topic.state === 'mastered';
                    const badge = getTopicStateBadge(topic.state);

                    return (
                      <div
                        key={topic.id}
                        className={`rounded-lg border p-3.5 transition-all space-y-2.5 ${
                          isDone
                            ? 'border-zinc-800/60 bg-zinc-900/40 opacity-75'
                            : 'border-zinc-800 bg-zinc-900/90 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() =>
                                onUpdateTopicState(
                                  topic.id,
                                  isDone ? 'learning' : 'completed',
                                  isDone ? 30 : 90
                                )
                              }
                              className="mt-0.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Circle className="h-4 w-4 text-zinc-600" />
                              )}
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-medium ${
                                    isDone ? 'text-zinc-400 line-through' : 'text-zinc-100'
                                  }`}
                                >
                                  {topic.name}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.2 text-[9px] font-mono border ${badge.style}`}
                                >
                                  {badge.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-normal">
                                {topic.description}
                              </p>
                            </div>
                          </div>

                          {/* Topic Actions */}
                          <div className="flex items-center gap-2 pl-7 sm:pl-0 shrink-0">
                            {/* State Selector Dropdown */}
                            <select
                              value={topic.state}
                              onChange={e =>
                                onUpdateTopicState(
                                  topic.id,
                                  e.target.value as SkillTopicState,
                                  e.target.value === 'completed' || e.target.value === 'mastered' ? 95 : 50
                                )
                              }
                              className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none"
                            >
                              <option value="not_started">Available</option>
                              <option value="learning">Learning</option>
                              <option value="practicing">Practicing</option>
                              <option value="understood">Understood</option>
                              <option value="applied">Applied</option>
                              <option value="completed">Completed</option>
                              <option value="mastered">Mastered</option>
                            </select>

                            <button
                              onClick={() => onStartKnowledgeCheck(topic.name)}
                              className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                              title="Verify retention check"
                            >
                              <HelpCircle className="h-3 w-3 text-zinc-400" />
                              <span>Check</span>
                            </button>

                            <button
                              onClick={() => onSelectTopicForPractice(topic)}
                              className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-750 px-2 py-1 text-xs text-zinc-200 hover:text-white transition-colors"
                              title="Log practice for this topic"
                            >
                              <Zap className="h-3 w-3 text-zinc-300" />
                              <span>Practice</span>
                            </button>

                            <button
                              onClick={() => onDeleteTopic(domain.id, topic.id)}
                              className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                              title="Delete topic"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Practice prompt & challenge */}
                        {topic.practicePrompt && (
                          <div className="rounded-md bg-zinc-950/60 p-2.5 text-xs text-zinc-300 border border-zinc-800/80">
                            <span className="font-semibold text-zinc-200">Challenge: </span>
                            <span className="text-zinc-400 text-[11px]">{topic.practicePrompt}</span>
                          </div>
                        )}

                        {/* Subtopics Checklist */}
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div className="space-y-1.5 pt-1 pl-7">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                              Core Components:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {topic.subtopics.map(sub => (
                                <div
                                  key={sub.id}
                                  className="flex items-center gap-2 text-[11px] text-zinc-300 bg-zinc-950/40 border border-zinc-850 rounded px-2 py-1"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                                  <span className="truncate">{sub.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredDomains.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-xs text-zinc-400">
            No domains found for stage &quot;{activeStageFilter}&quot;. Switch back to &quot;Full Roadmap&quot; to inspect all syllabus modules.
          </div>
        )}
      </div>

      {/* MODAL: ADD CUSTOM TOPIC */}
      {addTopicDomainId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-ambient-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100">Add Custom Topic</h3>
              <button
                onClick={() => setAddTopicDomainId(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomTopic} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  placeholder="e.g. Memory Layout & Zero-Copy Deserialization"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Description / Mental Model
                </label>
                <textarea
                  rows={2}
                  value={newTopicDesc}
                  onChange={e => setNewTopicDesc(e.target.value)}
                  placeholder="Key mechanics or architectural concepts to master..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Target Practice Challenge
                </label>
                <input
                  type="text"
                  value={newTopicPrompt}
                  onChange={e => setNewTopicPrompt(e.target.value)}
                  placeholder="e.g. Write a benchmark comparing byte buffer parsing speeds"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddTopicDomainId(null)}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTopicName.trim()}
                  className="rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
