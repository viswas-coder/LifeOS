import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  GraduationCap,
  FolderGit2,
  Target,
  Plus,
  Compass,
  Lightbulb,
  AlertCircle,
  Trophy,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { askWhatToDoNow, askWhatToLearnNext } from '../services/aiService';
import { Task, Skill } from '../types';
import { getSkillMasteryPercentage } from '../utils/progressEngine';

interface DashboardViewProps {
  onNavigate: (view: any) => void;
  onSelectSkill?: (skillId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onSelectSkill }) => {
  const {
    profile,
    settings,
    tasks,
    skills,
    projects,
    goals,
    calendar,
    wins,
    learningSessions,
    toggleTaskComplete,
    startMomentumMode,
    setIsQuickAddOpen,
    skillsProgressPercentage,
    addDailyWin,
  } = useLifeOS();

  // Dynamic recommendations
  const [whatToDoNow, setWhatToDoNow] = useState<{
    title: string;
    taskId?: string;
    durationMinutes: number;
    why: string;
    steps: string[];
  } | null>(null);

  const [whatToLearnNext, setWhatToLearnNext] = useState<{
    skillName: string;
    topicName: string;
    why: string;
    estimatedMinutes: number;
    practicalExercise: string;
  } | null>(null);

  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [newWinText, setNewWinText] = useState('');

  // Personalized Greeting
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    else if (hour >= 17) timeGreeting = 'Good evening';

    if (settings.personality === 'direct') {
      return `${timeGreeting}, ${profile.name}. High-priority execution queue is ready.`;
    }
    if (settings.personality === 'friendly' || settings.personality === 'encouraging') {
      return `${timeGreeting}, ${profile.name} 👋 Ready to make meaningful progress today?`;
    }
    return `${timeGreeting}, ${profile.name}. System calibrated for focused mastery.`;
  }, [profile.name, settings.personality]);

  // Load recommendations
  const refreshRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const doNow = await askWhatToDoNow(tasks, projects, skills, goals, 45);
      setWhatToDoNow(doNow);
      const learnNext = await askWhatToLearnNext(skills, projects);
      setWhatToLearnNext(learnNext);
    } catch {
      // Local fallback handled within aiService
    } finally {
      setIsLoadingRecs(false);
    }
  };

  useEffect(() => {
    refreshRecommendations();
  }, []);

  // Today's Tasks
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(
    t => t.dueDate === todayDateStr || t.status === 'in_progress' || t.priority === 'urgent'
  ).slice(0, 6);

  // Upcoming Deadlines (next 7 days)
  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'completed' && t.dueDate > todayDateStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  // Contextual AI Suggestions based on real state
  const aiSuggestions = React.useMemo(() => {
    const list: string[] = [];
    const urgentTask = tasks.find(t => t.priority === 'urgent' && t.status !== 'completed');
    if (urgentTask) {
      list.push(`Focus on "${urgentTask.title}" before starting exploratory work.`);
    }
    const staleSkill = skills.find(s => {
      if (!s.lastPracticedAt) return true;
      const days = (Date.now() - new Date(s.lastPracticedAt).getTime()) / (1000 * 3600 * 24);
      return days >= 3;
    });
    if (staleSkill) {
      list.push(`You haven't practiced ${staleSkill.name} in over 3 days. A 20-minute session will preserve retention.`);
    }
    const blockingProj = projects.find(p => p.progress < 70 && p.status === 'active');
    if (blockingProj) {
      list.push(`Project "${blockingProj.name}" has pending milestones due soon.`);
    }
    if (list.length === 0) {
      list.push('All core tracks are in good momentum. Continue deep practice on your primary skill roadmap.');
    }
    return list;
  }, [tasks, skills, projects]);

  const handleLogWin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWinText.trim()) return;
    addDailyWin(newWinText.trim(), 'accomplishment');
    setNewWinText('');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
      {/* 1. Hero Page Command Center with God Hands ASCII Background */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
        {/* God Hands ASCII Background Artwork */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 pointer-events-none transition-opacity duration-700 hover:opacity-45"
          style={{ backgroundImage: `url('/assets/god_hands_ascii.jpg')` }}
        />
        {/* Atmospheric Grey & Monochromatic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/50 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#09090b_90%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-1">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-850/90 border border-zinc-700/80 text-[11px] font-mono uppercase tracking-widest text-zinc-300 mb-3 shadow-sm backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-pulse" />
                <span>LifeOS · Executive Command</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
                {greeting}
              </h1>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                {tasks.filter(t => t.status !== 'completed').length} active tasks · {skills.length} learning tracks · {calendar.filter(c => c.date === todayDateStr).length} time blocks today
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-850/90 hover:bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:text-white transition-all shadow-sm backdrop-blur-md"
              >
                <Plus className="h-3.5 w-3.5 text-zinc-400" />
                <span>Quick Add</span>
              </button>
              <button
                onClick={() => onNavigate('ai_agent')}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-200 hover:bg-white px-3.5 py-2 text-xs font-semibold text-zinc-950 transition-all shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-zinc-900" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {/* Skills Progress Gauge in Grey Styling */}
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/80 backdrop-blur-md p-4 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-200">Skills Progress</span>
                <span className="text-[11px] text-zinc-400">
                  {skills.length === 0
                    ? 'No skills added yet'
                    : `Average mastery across ${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}`}
                </span>
              </div>
              <span className="font-mono text-sm font-semibold text-zinc-100">{skillsProgressPercentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-300 transition-all duration-500 ease-out"
                style={{ width: `${skillsProgressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. TODAY: Priority Tasks & AI Suggestion */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Today
          </h2>
          <button
            onClick={() => onNavigate('tasks')}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <span>View task engine</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Tasks List (7 cols) */}
          <div className="lg:col-span-7 space-y-2">
            {todayTasks.map(task => {
              const isDone = task.status === 'completed';
              const project = projects.find(p => p.id === task.projectId);

              return (
                <div
                  key={task.id}
                  id={`task-item-${task.id}`}
                  className={`group flex items-start gap-3 rounded-lg border px-3.5 py-2.5 transition-all ${
                    isDone
                      ? 'border-transparent bg-zinc-900/30 opacity-50'
                      : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-850'
                  }`}
                >
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    className="mt-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium ${
                          isDone ? 'line-through text-zinc-500' : 'text-zinc-200'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.priority === 'urgent' && (
                        <span className="rounded px-1.5 py-0.2 text-[9px] font-mono uppercase tracking-wider text-rose-300 bg-rose-500/10 border border-rose-500/20">
                          urgent
                        </span>
                      )}
                      {task.priority === 'high' && (
                        <span className="rounded px-1.5 py-0.2 text-[9px] font-mono uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/20">
                          high
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 pt-1">
                      {task.dueTime && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3 text-zinc-500" />
                          {task.dueTime}
                        </span>
                      )}
                      {project && (
                        <span className="truncate text-zinc-400">{project.name}</span>
                      )}
                      {task.estimatedDuration && (
                        <span className="font-mono text-zinc-500">{task.estimatedDuration}m</span>
                      )}
                    </div>
                  </div>

                  {!isDone && (
                    <button
                      onClick={() => startMomentumMode(task)}
                      className="opacity-0 group-hover:opacity-100 rounded border border-zinc-700/80 bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-200 hover:text-white hover:bg-zinc-750 transition-all"
                      title="Focus on this task"
                    >
                      Focus →
                    </button>
                  )}
                </div>
              );
            })}

            {todayTasks.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center text-xs text-zinc-400">
                No pending tasks for today. You're completely clear.
              </div>
            )}
          </div>

          {/* Right: AI Suggestion Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* ✦ AI SUGGESTION CARD IN GREY THEME */}
            <div
              id="card-what-to-do-now"
              className="rounded-xl border border-zinc-700/70 bg-zinc-900/90 p-4.5 space-y-3 relative shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                  <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
                  <span>AI Suggestion</span>
                </div>
                <button
                  onClick={refreshRecommendations}
                  disabled={isLoadingRecs}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Refresh recommendation"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingRecs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {whatToDoNow ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100 leading-snug">
                      {whatToDoNow.title}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-300 bg-zinc-800 border border-zinc-700/60 px-1.5 py-0.5 rounded shrink-0">
                      {whatToDoNow.durationMinutes}m
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {whatToDoNow.why}
                  </p>

                  {whatToDoNow.steps && whatToDoNow.steps.length > 0 && (
                    <div className="pt-1 text-[11px] text-zinc-400 space-y-1">
                      <p className="text-zinc-400 font-medium">Suggested steps:</p>
                      <ul className="space-y-0.5">
                        {whatToDoNow.steps.slice(0, 2).map((st, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-zinc-300">
                            <span className="text-zinc-500">→</span>
                            <span className="truncate">{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const target = tasks.find(t => t.id === whatToDoNow?.taskId) || tasks[0];
                        startMomentumMode(target);
                      }}
                      className="text-xs font-medium text-zinc-200 hover:text-white flex items-center gap-1 group"
                    >
                      <span>Start Focus</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={refreshRecommendations}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Next suggestion
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-xs text-zinc-400 text-center">
                  Analyzing current execution priorities...
                </div>
              )}
            </div>

            {/* ✦ LEARNING FOCUS IN GREY THEME */}
            <div
              id="card-what-to-learn-next"
              className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4.5 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  <GraduationCap className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Next Skill Focus</span>
                </div>
                <button
                  onClick={() => onNavigate('skills')}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  Roadmap →
                </button>
              </div>

              {whatToLearnNext ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {whatToLearnNext.topicName}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-300 bg-zinc-800 border border-zinc-700/60 px-1.5 py-0.5 rounded shrink-0">
                      {whatToLearnNext.estimatedMinutes}m
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {whatToLearnNext.why}
                  </p>
                  {whatToLearnNext.practicalExercise && (
                    <p className="text-[11px] text-zinc-300 bg-zinc-850/80 border border-zinc-750 p-2 rounded-lg">
                      <span className="text-zinc-400 font-medium">Exercise: </span>
                      {whatToLearnNext.practicalExercise}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-3 text-xs text-zinc-400 text-center">
                  Reviewing active curriculum...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. LEARNING & UPCOMING DEADLINES IN GREY THEME */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Learning Tracks & Deadlines
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Skill Tracks */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4.5 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-200">Active Skill Tracks</span>
              <button
                onClick={() => onNavigate('skills')}
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                All skills →
              </button>
            </div>

            <div className="space-y-3">
              {skills.slice(0, 3).map(skill => {
                const masteryPct = getSkillMasteryPercentage(skill, learningSessions, projects);
                return (
                  <div
                    key={skill.id}
                    onClick={() => onSelectSkill ? onSelectSkill(skill.id) : onNavigate('skills')}
                    className="cursor-pointer group space-y-1.5 rounded-lg p-2 hover:bg-zinc-850 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {skill.name}
                      </span>
                      <span className="font-mono text-zinc-400">{masteryPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-zinc-300 transition-all duration-300"
                        style={{ width: `${masteryPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{skill.domains.length} modules</span>
                      <span className="capitalize">{skill.state}</span>
                    </div>
                  </div>
                );
              })}

              {skills.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-500">
                  No active learning tracks. Go to Skills to generate or add one.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4.5 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-200">Upcoming Deadlines</span>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Calendar →
              </button>
            </div>

            <div className="space-y-2">
              {upcomingDeadlines.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-850/60 px-3 py-2 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="truncate font-medium text-zinc-200">{item.title}</p>
                    <p className="text-[10px] text-zinc-400">Due {item.dueDate}</p>
                  </div>
                  <span className="rounded bg-zinc-800 border border-zinc-700/60 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300 uppercase tracking-wider">
                    {item.priority}
                  </span>
                </div>
              ))}

              {upcomingDeadlines.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-500">
                  No upcoming deadlines in the next 7 days.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. CONTEXT & DAILY WINS IN GREY THEME */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Daily Log & Intelligence
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Wins */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-200">Daily Wins & Log</span>
              <span className="text-[11px] text-zinc-500">{wins.length} logged</span>
            </div>

            <form onSubmit={handleLogWin} className="flex gap-2">
              <input
                type="text"
                value={newWinText}
                onChange={e => setNewWinText(e.target.value)}
                placeholder="Log a win, breakthrough, or finished milestone..."
                className="flex-1 rounded-lg border border-zinc-700/80 bg-zinc-850 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 px-3.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white transition-colors"
              >
                Log
              </button>
            </form>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {wins.slice(0, 4).map(w => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-850/50 px-2.5 py-1.5 text-xs"
                >
                  <span className="text-zinc-300 truncate">{w.text}</span>
                  <span className="text-[9px] text-zinc-400 font-mono uppercase ml-2 shrink-0">{w.category}</span>
                </div>
              ))}

              {wins.length === 0 && (
                <div className="py-4 text-center text-xs text-zinc-500">
                  No wins logged today yet. Record your breakthroughs above.
                </div>
              )}
            </div>
          </div>

          {/* AI Contextual Insights */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4.5 space-y-3 shadow-md">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
              <span className="text-xs font-medium text-zinc-200">System Observations</span>
            </div>

            <div className="space-y-2">
              {aiSuggestions.map((sug, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-zinc-800 bg-zinc-850/40 p-2.5 text-xs text-zinc-400 leading-relaxed"
                >
                  <span className="text-zinc-500 mt-0.5">•</span>
                  <p>{sug}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
