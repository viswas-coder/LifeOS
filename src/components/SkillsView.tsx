import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Star,
  Award,
  Zap,
  BookOpen,
  FolderGit2,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Sliders,
  Calendar,
  Layers,
  FileText,
  Trash2,
  Percent,
  X,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import {
  Skill,
  SkillDomain,
  SkillTopic,
  SkillTopicState,
  SkillLearningSession,
  KnowledgeCheck,
  SkillMasteryProject,
} from '../types';
import { calculateSkillMastery, getSkillMasteryPercentage } from '../utils/progressEngine';
import { ProgressBar } from './common/ProgressBar';
import { SkillNextActionCard } from './skills/SkillNextActionCard';
import { SkillMasteryEvidenceCard } from './skills/SkillMasteryEvidenceCard';
import { SkillRoadmapStageView } from './skills/SkillRoadmapStageView';
import { SkillMasteryProjectsView } from './skills/SkillMasteryProjectsView';
import { AddSkillModal } from './skills/AddSkillModal';
import { AdaptRoadmapModal } from './skills/AdaptRoadmapModal';
import { adaptSkillRoadmap } from '../services/aiService';

interface SkillsViewProps {
  initialSelectedSkillId?: string;
  onBackToDashboard?: () => void;
}

type SkillTab = 'roadmap' | 'evidence' | 'projects' | 'practice_logs';

export const SkillsView: React.FC<SkillsViewProps> = ({
  initialSelectedSkillId,
  onBackToDashboard,
}) => {
  const {
    skills,
    addSkill,
    updateSkill,
    updateSkillMastery,
    deleteSkill,
    updateTopicState,
    updateTopicDetails,
    addCustomTopic,
    deleteTopic,
    updateSkillMasteryProject,
    logSkillLearningSession,
    runKnowledgeCheck,
    learningSessions,
    projects,
    goals,
  } = useLifeOS();

  const [selectedSkillId, setSelectedSkillId] = useState<string>(
    initialSelectedSkillId || skills[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<SkillTab>('roadmap');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdaptModalOpen, setIsAdaptModalOpen] = useState(false);
  const [isLogSessionModalOpen, setIsLogSessionModalOpen] = useState(false);
  const [activeKnowledgeCheck, setActiveKnowledgeCheck] = useState<KnowledgeCheck | null>(null);
  const [isSetMasteryModalOpen, setIsSetMasteryModalOpen] = useState(false);
  const [editMasteryValue, setEditMasteryValue] = useState(0);

  // Log Practice Session form
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [sessionTimeMinutes, setSessionTimeMinutes] = useState(45);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionReflections, setSessionReflections] = useState('');
  const [sessionPractice, setSessionPractice] = useState('');
  const [sessionQuestions, setSessionQuestions] = useState('');
  const [sessionConfidence, setSessionConfidence] = useState(4);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  // Active skill resolution
  const currentSkill = skills.find(s => s.id === selectedSkillId) || skills[0];

  // Sessions for this active skill
  const skillSessions = learningSessions.filter(s => s.skillId === currentSkill?.id);

  // Open Log Practice modal pre-filled for a specific topic
  const handleStartSessionForTopic = (topicName: string, prompt?: string) => {
    if (!currentSkill) return;
    const matched = currentSkill.domains
      .flatMap(d => d.topics)
      .find(t => t.name.toLowerCase() === topicName.toLowerCase());

    if (matched) {
      setSelectedTopicIds([matched.id]);
    } else {
      const firstPending = currentSkill.domains
        .flatMap(d => d.topics)
        .find(t => t.state !== 'completed' && t.state !== 'mastered');
      setSelectedTopicIds(firstPending ? [firstPending.id] : []);
    }

    if (prompt) {
      setSessionPractice(`Target Challenge: ${prompt}`);
    } else {
      setSessionPractice('');
    }

    setIsLogSessionModalOpen(true);
  };

  const handleLogSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSkill) return;
    setIsSubmittingSession(true);
    try {
      await logSkillLearningSession({
        skillId: currentSkill.id,
        topicIds: selectedTopicIds,
        timeSpentMinutes: sessionTimeMinutes,
        notes: sessionNotes,
        userReflections: sessionReflections,
        practiceCompleted: sessionPractice,
        questions: sessionQuestions,
        confidence: sessionConfidence,
      });
      setIsLogSessionModalOpen(false);
      setSessionNotes('');
      setSessionReflections('');
      setSessionPractice('');
      setSessionQuestions('');
      setSelectedTopicIds([]);
      setActiveTab('practice_logs');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSession(false);
    }
  };

  const handleStartKnowledgeCheck = async (topicName: string) => {
    if (!currentSkill) return;
    try {
      const check = await runKnowledgeCheck(currentSkill.id, topicName);
      setActiveKnowledgeCheck(check);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdaptCurriculum = async (feedback: string) => {
    if (!currentSkill) return;
    try {
      const result = await adaptSkillRoadmap(currentSkill, feedback);
      if (result.success && result.adaptedDomains && result.adaptedDomains.length > 0) {
        updateSkill(currentSkill.id, { domains: result.adaptedDomains });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-7">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mr-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Dashboard</span>
                <span className="text-zinc-600">/</span>
              </button>
            )}
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-zinc-300" />
              <span>Skill Mastery Engine</span>
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Evidence-based syllabus progression, 5-stage structured roadmaps, and verifiable practical artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-add-skill"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* 2. Horizontal Skill Switcher Cards */}
      {skills.length > 0 ? (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {skills.map(s => {
            const isSelected = s.id === currentSkill?.id;
            const skillMastery = calculateSkillMastery(s, learningSessions, projects);
            const masteryPct = getSkillMasteryPercentage(s, learningSessions, projects);

            return (
              <button
                key={s.id}
                onClick={() => setSelectedSkillId(s.id)}
                className={`flex-shrink-0 flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all text-left min-w-[220px] ${
                  isSelected
                    ? 'border-zinc-700 bg-zinc-850 text-zinc-100 shadow-sm'
                    : 'border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color || '#a1a1aa' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold text-zinc-100">{s.name}</span>
                    <span className="font-mono text-xs text-zinc-300 font-medium">
                      {masteryPct}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
                    <span className="capitalize">{skillMastery.masteryInfo.label}</span>
                    <span>·</span>
                    <span>{Math.round(s.totalPracticeMinutes / 60)}h {s.totalPracticeMinutes % 60}m</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center space-y-3">
          <GraduationCap className="h-8 w-8 text-zinc-500 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-200">No Skills Added Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Build your personalized mastery tree with AI-guided 5-stage roadmaps, practical projects, and evidence tracking.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Your First Skill</span>
          </button>
        </div>
      )}

      {currentSkill && (
        <>
          {/* 3. Skill Hero Overview Bar */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4 shadow-ambient-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                    {currentSkill.name}
                  </h2>
                  <span className="rounded bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300">
                    {currentSkill.category || 'Discipline'}
                  </span>
                  <span className="rounded bg-zinc-850 border border-zinc-750 px-2 py-0.5 text-[10px] font-mono capitalize text-zinc-400">
                    {currentSkill.state}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  {currentSkill.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1 font-mono">
                  <span>Started: <strong className="text-zinc-300 font-normal">{currentSkill.startedAt}</strong></span>
                  <span>Last practice: <strong className="text-zinc-300 font-normal">{currentSkill.lastPracticedAt || 'None'}</strong></span>
                  <span>Total deliberate practice: <strong className="text-zinc-300 font-normal">{Math.round(currentSkill.totalPracticeMinutes / 60)}h {currentSkill.totalPracticeMinutes % 60}m</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
                <button
                  id="btn-adjust-mastery"
                  onClick={() => {
                    const currentPct = getSkillMasteryPercentage(currentSkill, learningSessions, projects);
                    setEditMasteryValue(currentPct);
                    setIsSetMasteryModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-750 bg-zinc-850 hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                  title="Adjust or set skill mastery percentage"
                >
                  <Percent className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Set Mastery ({getSkillMasteryPercentage(currentSkill, learningSessions, projects)}%)</span>
                </button>

                <button
                  id="btn-open-adapt-curriculum"
                  onClick={() => setIsAdaptModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-750 bg-zinc-850 hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  <Sliders className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Adapt Roadmap</span>
                </button>

                <button
                  id="btn-open-log-session"
                  onClick={() => {
                    const firstPending = currentSkill.domains
                      .flatMap(d => d.topics)
                      .find(t => t.state !== 'completed' && t.state !== 'mastered');
                    setSelectedTopicIds(firstPending ? [firstPending.id] : []);
                    setIsLogSessionModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-2 text-xs font-medium transition-all shadow-sm whitespace-nowrap"
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Log Practice</span>
                </button>

                <button
                  id="btn-delete-skill"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to remove the skill "${currentSkill.name}"?`)) {
                      deleteSkill(currentSkill.id);
                      const remaining = skills.filter(s => s.id !== currentSkill.id);
                      setSelectedSkillId(remaining[0]?.id || '');
                    }
                  }}
                  className="flex items-center justify-center rounded-lg border border-zinc-800 hover:border-red-900/60 bg-zinc-900/60 hover:bg-red-950/30 p-2 text-zinc-400 hover:text-red-300 transition-colors"
                  title="Remove Skill from LifeOS"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4. AI Recommendation Target */}
          <SkillNextActionCard
            skill={currentSkill}
            projects={projects}
            goals={goals}
            onStartSessionForTopic={handleStartSessionForTopic}
          />

          {/* 5. Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 transition-all ${
                activeTab === 'roadmap'
                  ? 'border-zinc-100 text-zinc-100 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>5-Stage Roadmap</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 transition-all ${
                activeTab === 'evidence'
                  ? 'border-zinc-100 text-zinc-100 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Mastery & Evidence</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 transition-all ${
                activeTab === 'projects'
                  ? 'border-zinc-100 text-zinc-100 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FolderGit2 className="h-4 w-4" />
              <span>Mastery Projects ({currentSkill.masteryProjects?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('practice_logs')}
              className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 transition-all ${
                activeTab === 'practice_logs'
                  ? 'border-zinc-100 text-zinc-100 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Practice History ({skillSessions.length})</span>
            </button>
          </div>

          {/* 6. Active Tab Content */}
          {activeTab === 'roadmap' && (
            <SkillRoadmapStageView
              skill={currentSkill}
              onUpdateTopicState={(topicId, state, score) =>
                updateTopicState(currentSkill.id, topicId, state, score)
              }
              onStartKnowledgeCheck={handleStartKnowledgeCheck}
              onAddCustomTopic={(domainId, name, desc, prompt) =>
                addCustomTopic(currentSkill.id, domainId, {
                  name,
                  description: desc,
                  practicePrompt: prompt,
                  state: 'not_started',
                  mastery: 0,
                  prerequisites: [],
                  subtopics: [],
                  difficulty: 'intermediate',
                  importance: 'high',
                })
              }
              onDeleteTopic={(domainId, topicId) =>
                deleteTopic(currentSkill.id, domainId, topicId)
              }
              onSelectTopicForPractice={topic =>
                handleStartSessionForTopic(topic.name, topic.practicePrompt)
              }
            />
          )}

          {activeTab === 'evidence' && (
            <SkillMasteryEvidenceCard
              skill={currentSkill}
              sessions={skillSessions}
              projects={projects}
              onLogPracticeClick={() => {
                const firstPending = currentSkill.domains
                  .flatMap(d => d.topics)
                  .find(t => t.state !== 'completed' && t.state !== 'mastered');
                setSelectedTopicIds(firstPending ? [firstPending.id] : []);
                setIsLogSessionModalOpen(true);
              }}
            />
          )}

          {activeTab === 'projects' && (
            <SkillMasteryProjectsView
              skill={currentSkill}
              projects={projects}
              onUpdateProject={(projectId, updates) =>
                updateSkillMasteryProject(currentSkill.id, projectId, updates)
              }
            />
          )}

          {activeTab === 'practice_logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Logged Practice Sessions & AI Evaluations
                </h3>
                <button
                  onClick={() => setIsLogSessionModalOpen(true)}
                  className="text-xs font-medium text-zinc-300 hover:text-white underline"
                >
                  + Log Practice Session
                </button>
              </div>

              {skillSessions.length > 0 ? (
                <div className="space-y-3">
                  {skillSessions.map(session => (
                    <div
                      key={session.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4.5 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-200">
                            {new Date(session.date).toLocaleDateString([], {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                            {session.timeSpentMinutes} mins
                          </span>
                          {session.confidence && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              Confidence: {session.confidence}/5
                            </span>
                          )}
                        </div>

                        {session.rating && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 uppercase font-mono">
                              AI Score:
                            </span>
                            <span className="font-mono text-xs font-semibold text-zinc-100 flex items-center gap-0.5">
                              <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                              {session.rating.overallScore}/10
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Practice Activity */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-zinc-400">Activity Built:</span>
                        <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                          {session.practiceCompleted}
                        </p>
                      </div>

                      {/* Notes & Reflections */}
                      {(session.notes || session.userReflections) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {session.notes && (
                            <div className="rounded border border-zinc-850 bg-zinc-950/30 p-2 text-zinc-400 text-[11px]">
                              <strong className="text-zinc-300 font-medium block mb-0.5">Notes:</strong>
                              {session.notes}
                            </div>
                          )}
                          {session.userReflections && (
                            <div className="rounded border border-zinc-850 bg-zinc-950/30 p-2 text-zinc-400 text-[11px]">
                              <strong className="text-zinc-300 font-medium block mb-0.5">Reflection:</strong>
                              {session.userReflections}
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Evaluation Dimensions */}
                      {session.rating?.dimensions && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-zinc-800/60">
                          {Object.entries(session.rating.dimensions).map(([dim, val]) => (
                            <div
                              key={dim}
                              className="rounded border border-zinc-850 bg-zinc-950/40 p-2 space-y-0.5"
                            >
                              <div className="flex justify-between text-[10px] font-medium">
                                <span className="capitalize text-zinc-300">{dim}</span>
                                <span className="font-mono text-zinc-400">{val.score}/10</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 line-clamp-2">{val.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-xs text-zinc-400">
                  No practice sessions logged yet. Record a session to build deliberate practice volume.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL: ADD SKILL */}
      <AddSkillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (name, desc, category, options) => {
          const created = await addSkill(name, desc, { ...(options || {}), category });
          setSelectedSkillId(created.id);
        }}
        projects={projects}
        goals={goals}
      />

      {/* MODAL: ADAPT CURRICULUM */}
      {currentSkill && (
        <AdaptRoadmapModal
          isOpen={isAdaptModalOpen}
          skill={currentSkill}
          onClose={() => setIsAdaptModalOpen(false)}
          onAdapt={handleAdaptCurriculum}
        />
      )}

      {/* MODAL: LOG PRACTICE SESSION */}
      {isLogSessionModalOpen && currentSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-ambient-lg space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100">
                Log Deliberate Practice: {currentSkill.name}
              </h3>
              <button
                onClick={() => setIsLogSessionModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogSessionSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Topics Covered
                </label>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-1.5 space-y-0.5">
                  {currentSkill.domains.flatMap(d => d.topics).map(top => {
                    const isSelected = selectedTopicIds.includes(top.id);
                    return (
                      <div
                        key={top.id}
                        onClick={() => {
                          setSelectedTopicIds(prev =>
                            isSelected ? prev.filter(id => id !== top.id) : [...prev, top.id]
                          );
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer text-xs transition-colors ${
                          isSelected
                            ? 'bg-zinc-800 text-zinc-100 font-medium'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                        }`}
                      >
                        <span className="truncate">{top.name}</span>
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-zinc-200 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Minutes Spent
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={sessionTimeMinutes}
                    onChange={e => setSessionTimeMinutes(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Confidence (1-5)
                  </label>
                  <select
                    value={sessionConfidence}
                    onChange={e => setSessionConfidence(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    <option value={1}>1 - Just started, still hazy</option>
                    <option value={2}>2 - Understood basic concepts</option>
                    <option value={3}>3 - Solid grasp of mechanics</option>
                    <option value={4}>4 - High confidence & fluidity</option>
                    <option value={5}>5 - Mastery: could teach it</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  What did you practice or build? *
                </label>
                <textarea
                  rows={2}
                  required
                  value={sessionPractice}
                  onChange={e => setSessionPractice(e.target.value)}
                  placeholder="e.g. Implemented custom zero-copy buffer serializer, validated edge cases..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Key Learnings & Takeaways
                </label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="Key mental models or architectural insights..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsLogSessionModalOpen(false)}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSession || !sessionPractice.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
                >
                  {isSubmittingSession ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Evaluating Mastery...</span>
                    </>
                  ) : (
                    <span>Submit & Evaluate</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KNOWLEDGE CHECK */}
      {activeKnowledgeCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-ambient-lg space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100">
                Retention Check: {activeKnowledgeCheck.topicName}
              </h3>
              <button
                onClick={() => setActiveKnowledgeCheck(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {activeKnowledgeCheck.questions.map((q, qIdx) => (
                <div key={q.id} className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                  <div className="text-xs font-medium text-zinc-100">
                    {qIdx + 1}. {q.question}
                  </div>

                  <div className="space-y-1.5">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = q.userSelection === oIdx;
                      const isRevealed = q.userSelection !== undefined;
                      const isCorrect = oIdx === q.correctIndex;

                      let btnStyle = 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700';
                      if (isRevealed) {
                        if (isCorrect) btnStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
                        else if (isSelected) btnStyle = 'border-rose-500/50 bg-rose-500/10 text-rose-300';
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={isRevealed}
                          onClick={() => {
                            const updated = { ...activeKnowledgeCheck };
                            updated.questions[qIdx].userSelection = oIdx;
                            updated.questions[qIdx].isCorrect = oIdx === q.correctIndex;
                            setActiveKnowledgeCheck(updated);
                          }}
                          className={`w-full rounded-md border p-2 text-left text-xs transition-all ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {q.userSelection !== undefined && (
                    <div className="rounded bg-zinc-950/60 p-2 text-[11px] text-zinc-400 border border-zinc-850">
                      <span className="font-medium text-zinc-300">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveKnowledgeCheck(null)}
                className="rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Skill Mastery Modal */}
      {isSetMasteryModalOpen && currentSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-ambient-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Set Skill Mastery</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{currentSkill.name}</p>
              </div>
              <button
                onClick={() => setIsSetMasteryModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Mastery Percentage</span>
                <span className="font-mono text-base font-bold text-zinc-100">{editMasteryValue}%</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={editMasteryValue}
                onChange={e => setEditMasteryValue(Number(e.target.value))}
                className="w-full accent-zinc-200 cursor-pointer"
              />

              <div className="flex items-center gap-1.5 pt-1">
                {[0, 20, 40, 60, 80, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEditMasteryValue(val)}
                    className={`flex-1 rounded border px-1.5 py-1 text-[11px] font-mono transition-colors ${
                      editMasteryValue === val
                        ? 'border-zinc-500 bg-zinc-800 text-zinc-100 font-semibold'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-zinc-500 leading-normal">
                Setting this mastery level immediately updates this skill and synchronizes the Skills Progress bar across LifeOS.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsSetMasteryModalOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-save-mastery"
                onClick={() => {
                  updateSkillMastery(currentSkill.id, editMasteryValue);
                  setIsSetMasteryModalOpen(false);
                }}
                className="rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 text-xs font-semibold"
              >
                Save Mastery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
