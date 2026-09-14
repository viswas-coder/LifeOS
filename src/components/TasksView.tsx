import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Zap,
  Sparkles,
  Clock,
  Circle,
  CheckCircle2,
  Trash2,
  FolderGit2,
  GraduationCap,
  ChevronDown,
  Calendar,
  Filter,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { Task } from '../types';

export const TasksView: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    breakdownTaskAI,
    startMomentumMode,
    projects,
    skills,
  } = useLifeOS();

  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'urgent' | 'completed'>('all');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Task['priority']>('medium');
  const [quickDueDate, setQuickDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [isAiBreakingDown, setIsAiBreakingDown] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'today') return task.dueDate === todayStr;
    if (activeFilter === 'urgent') return task.priority === 'urgent' || task.priority === 'high';
    if (activeFilter === 'completed') return task.status === 'completed';
    return task.status !== 'completed';
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle.trim(),
      priority: quickPriority,
      status: 'not_started',
      dueDate: quickDueDate,
      subtasks: [],
      tags: [],
    });
    setQuickTitle('');
  };

  const handleBreakdown = async (taskId: string) => {
    setIsAiBreakingDown(taskId);
    try {
      await breakdownTaskAI(taskId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiBreakingDown(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Tasks & Execution</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Prioritize actions, break down complexity with AI, and enter focused momentum.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.06]">
          {(['all', 'today', 'urgent', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all ${
                activeFilter === f
                  ? 'bg-white/[0.1] text-neutral-100 shadow-ambient-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="flex flex-col sm:flex-row items-center gap-2 rounded-xl border border-white/[0.08] bg-[#12141a] p-2"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          placeholder="Capture an action item..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
        />

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <select
            value={quickPriority}
            onChange={e => setQuickPriority(e.target.value as any)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="low" className="bg-neutral-900">Low</option>
            <option value="medium" className="bg-neutral-900">Medium</option>
            <option value="high" className="bg-neutral-900">High</option>
            <option value="urgent" className="bg-neutral-900">Urgent</option>
          </select>

          <input
            type="date"
            value={quickDueDate}
            onChange={e => setQuickDueDate(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
          />

          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3 py-1.5 text-xs font-medium transition-all shadow-ambient-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Tasks List */}
      <div className="space-y-2">
        {filteredTasks.map(task => {
          const isDone = task.status === 'completed';
          const project = projects.find(p => p.id === task.projectId);
          const skill = skills.find(s => s.id === task.skillId);

          return (
            <div
              key={task.id}
              className={`group rounded-lg border px-3.5 py-3 transition-all space-y-2 ${
                isDone
                  ? 'border-transparent bg-white/[0.01] opacity-45'
                  : 'border-white/[0.06] bg-[#12141a] hover:border-white/[0.12] hover:bg-[#151821]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    className="mt-0.5 text-neutral-500 hover:text-neutral-300 transition-colors"
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
                          isDone ? 'line-through text-neutral-500' : 'text-neutral-200'
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

                    {task.description && (
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-1.5 flex-wrap">
                      {task.dueDate && (
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="h-3 w-3 text-neutral-500" />
                          {task.dueDate} {task.dueTime ? `· ${task.dueTime}` : ''}
                        </span>
                      )}
                      {project && (
                        <span className="flex items-center gap-1 text-neutral-400 truncate">
                          <FolderGit2 className="h-3 w-3 text-neutral-500" />
                          {project.name}
                        </span>
                      )}
                      {skill && (
                        <span className="flex items-center gap-1 text-neutral-400 truncate">
                          <GraduationCap className="h-3 w-3 text-neutral-500" />
                          {skill.name}
                        </span>
                      )}
                      {task.estimatedDuration && (
                        <span className="text-neutral-500 font-mono">
                          {task.estimatedDuration}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Actions - reveal on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {!isDone && (
                    <>
                      <button
                        onClick={() => startMomentumMode(task)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Start focus"
                      >
                        <Zap className="h-3 w-3 text-amber-400" />
                        <span>Focus</span>
                      </button>

                      <button
                        onClick={() => handleBreakdown(task.id)}
                        disabled={isAiBreakingDown === task.id}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="AI Subtask Breakdown"
                      >
                        <Sparkles className={`h-3 w-3 text-indigo-400 ${isAiBreakingDown === task.id ? 'animate-spin' : ''}`} />
                        <span>Breakdown</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-md transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Subtasks if present */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="border-t border-white/[0.04] pt-2 pl-7 space-y-1">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
                  </div>
                  {task.subtasks.map((sub, sIdx) => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        const updated = task.subtasks.map((st, idx) =>
                          idx === sIdx ? { ...st, completed: !st.completed } : st
                        );
                        updateTask(task.id, { subtasks: updated });
                      }}
                      className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer hover:text-neutral-200"
                    >
                      {sub.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-neutral-600" />
                      )}
                      <span className={sub.completed ? 'line-through text-neutral-600' : ''}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="surface-card rounded-lg p-10 text-center text-xs text-neutral-500">
            No tasks found in this view.
          </div>
        )}
      </div>
    </div>
  );
};
