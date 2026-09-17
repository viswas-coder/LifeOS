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
  Calendar,
  Edit2,
  AlertTriangle,
  Play,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { Task, TaskStatus } from '../types';
import { getLocalDateString, isTaskOverdue, isTaskDueToday, formatTaskDueDate } from '../utils/dateUtils';
import { EditTaskModal } from './tasks/EditTaskModal';
import { CreateTaskModal } from './tasks/CreateTaskModal';

type TaskFilter = 'all' | 'in_progress' | 'not_started' | 'today' | 'urgent' | 'overdue' | 'completed';

export const TasksView: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    setTaskStatus,
    breakdownTaskAI,
    startMomentumMode,
    projects,
    skills,
  } = useLifeOS();

  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Task['priority']>('medium');
  const [quickDueDate, setQuickDueDate] = useState(getLocalDateString());
  const [isAiBreakingDown, setIsAiBreakingDown] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Inline subtask input states
  const [addingSubtaskToId, setAddingSubtaskToId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const todayStr = getLocalDateString();

  // Metrics
  const todoCount = tasks.filter(t => t.status === 'not_started').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const dueTodayCount = tasks.filter(t => t.status !== 'completed' && t.dueDate === todayStr).length;
  const overdueCount = tasks.filter(t => isTaskOverdue(t.dueDate, t.status)).length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'in_progress') return task.status === 'in_progress';
    if (activeFilter === 'not_started') return task.status === 'not_started';
    if (activeFilter === 'today') return task.dueDate === todayStr && task.status !== 'completed';
    if (activeFilter === 'urgent') return (task.priority === 'urgent' || task.priority === 'high') && task.status !== 'completed';
    if (activeFilter === 'overdue') return isTaskOverdue(task.dueDate, task.status);
    if (activeFilter === 'completed') return task.status === 'completed';
    // 'all': show active tasks (in_progress & not_started), or all tasks
    return task.status !== 'completed';
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = quickTitle.trim();
    if (!cleanTitle) return;

    addTask({
      title: cleanTitle,
      priority: quickPriority,
      status: 'not_started',
      dueDate: quickDueDate || todayStr,
      subtasks: [],
      tags: [],
    });
    setQuickTitle('');
  };

  const handleBreakdown = async (taskId: string) => {
    setIsAiBreakingDown(taskId);
    try {
      await breakdownTaskAI(taskId);
    } catch {
      // Handled safely
    } finally {
      setIsAiBreakingDown(null);
    }
  };

  const handleAddSubtask = (taskId: string) => {
    const clean = newSubtaskTitle.trim();
    if (!clean) {
      setAddingSubtaskToId(null);
      return;
    }
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: clean,
      completed: false,
    };
    updateTask(taskId, {
      subtasks: [...(task.subtasks || []), newSubtask],
    });
    setNewSubtaskTitle('');
    setAddingSubtaskToId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Tasks & Execution</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Single source of truth for planning, in-progress execution, and completed objectives.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3.5 py-1.5 text-xs font-medium transition-all shadow-ambient-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Real-time Status Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
        <button
          onClick={() => setActiveFilter('not_started')}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
            activeFilter === 'not_started'
              ? 'border-white/20 bg-white/[0.08]'
              : 'border-white/[0.06] bg-[#12141a] hover:border-white/10'
          }`}
        >
          <span className="text-neutral-400">Todo</span>
          <span className="font-mono font-semibold text-neutral-100">{todoCount}</span>
        </button>

        <button
          onClick={() => setActiveFilter('in_progress')}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
            activeFilter === 'in_progress'
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              : 'border-white/[0.06] bg-[#12141a] hover:border-white/10'
          }`}
        >
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            In Progress
          </span>
          <span className="font-mono font-semibold text-amber-200">{inProgressCount}</span>
        </button>

        <button
          onClick={() => setActiveFilter('today')}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
            activeFilter === 'today'
              ? 'border-white/20 bg-white/[0.08]'
              : 'border-white/[0.06] bg-[#12141a] hover:border-white/10'
          }`}
        >
          <span className="text-neutral-400">Due Today</span>
          <span className="font-mono font-semibold text-neutral-100">{dueTodayCount}</span>
        </button>

        <button
          onClick={() => setActiveFilter('overdue')}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
            activeFilter === 'overdue'
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
              : 'border-white/[0.06] bg-[#12141a] hover:border-white/10'
          }`}
        >
          <span className={overdueCount > 0 ? 'text-rose-400 font-medium' : 'text-neutral-400'}>
            Overdue
          </span>
          <span className={`font-mono font-semibold ${overdueCount > 0 ? 'text-rose-400' : 'text-neutral-400'}`}>
            {overdueCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('completed')}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left col-span-2 sm:col-span-1 ${
            activeFilter === 'completed'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-white/[0.06] bg-[#12141a] hover:border-white/10'
          }`}
        >
          <span className="text-neutral-400">Completed</span>
          <span className="font-mono font-semibold text-emerald-400">{completedCount}</span>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.06]">
          {(
            [
              { id: 'all', label: 'Active Tasks' },
              { id: 'in_progress', label: 'In Execution' },
              { id: 'not_started', label: 'Todo' },
              { id: 'today', label: 'Today' },
              { id: 'urgent', label: 'Urgent' },
              { id: 'overdue', label: `Overdue ${overdueCount > 0 ? `(${overdueCount})` : ''}` },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === f.id
                  ? 'bg-white/[0.1] text-neutral-100 shadow-ambient-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {f.label}
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
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none w-full"
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
            disabled={!quickTitle.trim()}
            className="flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-white disabled:opacity-40 disabled:hover:bg-neutral-100 text-neutral-950 px-3 py-1.5 text-xs font-medium transition-all shadow-ambient-sm whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.map(task => {
          const isDone = task.status === 'completed';
          const isInProgress = task.status === 'in_progress';
          const isOverdue = isTaskOverdue(task.dueDate, task.status);
          const isToday = isTaskDueToday(task.dueDate);
          const dateInfo = formatTaskDueDate(task.dueDate, task.dueTime);
          const project = projects.find(p => p.id === task.projectId);
          const skill = skills.find(s => s.id === task.skillId);

          return (
            <div
              key={task.id}
              className={`group rounded-xl border p-4 transition-all space-y-3 ${
                isDone
                  ? 'border-transparent bg-white/[0.015] opacity-50'
                  : isInProgress
                  ? 'border-amber-500/30 bg-[#151720] shadow-sm'
                  : isOverdue
                  ? 'border-rose-500/20 bg-[#141216]'
                  : 'border-white/[0.06] bg-[#12141a] hover:border-white/[0.12] hover:bg-[#151821]'
              }`}
            >
              {/* Main Card Header Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Completion Toggle Button */}
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    className="mt-0.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                    title={isDone ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium ${
                          isDone ? 'line-through text-neutral-500' : 'text-neutral-200'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Status Selector Pill */}
                      <select
                        value={task.status}
                        onChange={e => setTaskStatus(task.id, e.target.value as TaskStatus)}
                        className={`rounded px-2 py-0.5 text-[10px] font-medium border focus:outline-none transition-colors ${
                          task.status === 'completed'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                            : task.status === 'in_progress'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 font-semibold'
                            : 'bg-white/[0.04] border-white/[0.08] text-neutral-400'
                        }`}
                      >
                        <option value="not_started" className="bg-neutral-900 text-neutral-200">Todo</option>
                        <option value="in_progress" className="bg-neutral-900 text-amber-300">In Progress</option>
                        <option value="completed" className="bg-neutral-900 text-emerald-300">Completed</option>
                      </select>

                      {/* Priority Badges */}
                      {task.priority === 'urgent' && (
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-rose-300 bg-rose-500/10 border border-rose-500/20">
                          urgent
                        </span>
                      )}
                      {task.priority === 'high' && (
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/20">
                          high
                        </span>
                      )}

                      {/* Overdue / Due Today tags */}
                      {isOverdue && !isDone && (
                        <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Overdue
                        </span>
                      )}
                      {isToday && !isDone && (
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20">
                          Due Today
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2">{task.description}</p>
                    )}

                    {/* Metadata chips */}
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-1 flex-wrap">
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 font-mono ${isOverdue ? 'text-rose-400 font-semibold' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          {dateInfo.label}
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
                        <span className="flex items-center gap-1 text-neutral-500 font-mono">
                          <Clock className="h-3 w-3" />
                          {task.estimatedDuration}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Actions Toolbar */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Execution Focus Button */}
                  {!isDone && (
                    <button
                      onClick={() => startMomentumMode(task)}
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        isInProgress
                          ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                          : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                      }`}
                      title={isInProgress ? 'Continue focused execution' : 'Start execution'}
                    >
                      <Zap className={`h-3 w-3 ${isInProgress ? 'text-amber-400 fill-amber-400' : 'text-amber-400'}`} />
                      <span>{isInProgress ? 'Executing' : 'Focus'}</span>
                    </button>
                  )}

                  {/* AI Breakdown Button */}
                  {!isDone && (
                    <button
                      onClick={() => handleBreakdown(task.id)}
                      disabled={isAiBreakingDown === task.id}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors"
                      title="AI Subtask Breakdown"
                    >
                      <Sparkles className={`h-3 w-3 text-indigo-400 ${isAiBreakingDown === task.id ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Breakdown</span>
                    </button>
                  )}

                  {/* Edit Task Button */}
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.06] rounded-md transition-colors"
                    title="Edit task"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete Task Button */}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Subtasks Section */}
              <div className="border-t border-white/[0.04] pt-2 pl-7 space-y-1.5">
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                      <span>Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</span>
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
                        className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer hover:text-neutral-200 py-0.5"
                      >
                        {sub.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                        )}
                        <span className={sub.completed ? 'line-through text-neutral-600' : ''}>
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Add Subtask Input */}
                {addingSubtaskToId === task.id ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtask(task.id);
                        } else if (e.key === 'Escape') {
                          setAddingSubtaskToId(null);
                        }
                      }}
                      placeholder="Enter subtask title..."
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddSubtask(task.id)}
                      className="px-2 py-1 rounded bg-neutral-200 text-neutral-900 text-xs font-medium hover:bg-white"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingSubtaskToId(null)}
                      className="text-xs text-neutral-500 hover:text-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAddingSubtaskToId(task.id);
                      setNewSubtaskTitle('');
                    }}
                    className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors pt-0.5"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add subtask</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="surface-card rounded-xl p-10 text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-white/[0.03] border border-white/[0.06] text-neutral-400">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div className="text-xs font-medium text-neutral-300">
              {activeFilter === 'in_progress'
                ? 'No tasks currently in execution.'
                : activeFilter === 'not_started'
                ? 'No pending tasks in Todo.'
                : activeFilter === 'today'
                ? 'No tasks due today.'
                : activeFilter === 'overdue'
                ? 'No overdue tasks. All deadlines are on track.'
                : activeFilter === 'completed'
                ? 'No completed tasks yet.'
                : 'No tasks found.'}
            </div>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              {activeFilter === 'in_progress'
                ? 'Select a task from Todo and click "Focus" to start real execution.'
                : 'Capture an action item above or click New Task to create one.'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSave={(id, updates) => updateTask(id, updates)}
        projects={projects}
        skills={skills}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={addTask}
        projects={projects}
        skills={skills}
      />
    </div>
  );
};
