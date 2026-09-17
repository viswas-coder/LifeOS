import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Task, TaskStatus, Priority, Project, Skill } from '../../types';
import { getLocalDateString } from '../../utils/dateUtils';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Task>) => void;
  projects: Project[];
  skills: Skill[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  projects,
  skills,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<string>('');
  const [skillId, setSkillId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'not_started');
      setDueDate(task.dueDate || getLocalDateString());
      setDueTime(task.dueTime || '');
      setEstimatedDuration(task.estimatedDuration ?? '');
      setProjectId(task.projectId || '');
      setSkillId(task.skillId || '');
      setError(null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Task title is required.');
      return;
    }

    onSave(task.id, {
      title: cleanTitle,
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: dueDate || getLocalDateString(),
      dueTime: dueTime.trim() || undefined,
      estimatedDuration: typeof estimatedDuration === 'number' ? estimatedDuration : undefined,
      projectId: projectId || undefined,
      skillId: skillId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#12141a] p-5 shadow-2xl space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Edit Task</h2>
            <p className="text-[11px] text-neutral-400 font-mono mt-0.5">ID: {task.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Task title..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/20"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional context or instructions..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/20 resize-none"
            />
          </div>

          {/* Status & Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-white/[0.08] bg-[#1a1d26] px-3 py-2 text-neutral-200 focus:outline-none"
              >
                <option value="not_started">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-white/[0.08] bg-[#1a1d26] px-3 py-2 text-neutral-200 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date, Time, Duration */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-neutral-200 focus:outline-none text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-neutral-200 focus:outline-none text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={estimatedDuration}
                onChange={e => setEstimatedDuration(e.target.value ? Number(e.target.value) : '')}
                placeholder="30"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-neutral-200 focus:outline-none text-[11px]"
              />
            </div>
          </div>

          {/* Project and Skill Linkage */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Project
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-[#1a1d26] px-3 py-2 text-neutral-200 focus:outline-none"
              >
                <option value="">None (Independent)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Skill Track
              </label>
              <select
                value={skillId}
                onChange={e => setSkillId(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-[#1a1d26] px-3 py-2 text-neutral-200 focus:outline-none"
              >
                <option value="">None (General)</option>
                {skills.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
