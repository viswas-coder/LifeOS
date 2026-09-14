import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  Calendar,
  GraduationCap,
  FolderGit2,
  Trash2,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { Goal } from '../types';

export const GoalsView: React.FC = () => {
  const { goals, addGoal, deleteGoal, toggleGoalMilestone, skills, projects } = useLifeOS();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<Goal['category']>('technical');
  const [newDate, setNewDate] = useState(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addGoal({
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      targetDate: newDate,
      progress: 0,
      milestones: [
        { id: 'gm1', title: 'Complete foundational syllabus and architecture blueprint', completed: false, dueDate: newDate },
        { id: 'gm2', title: 'Ship production prototype and gather telemetry', completed: false, dueDate: newDate },
        { id: 'gm3', title: 'Publish technical synthesis or benchmark results', completed: false, dueDate: newDate },
      ],
      linkedSkillIds: skills.slice(0, 1).map(s => s.id),
      linkedProjectIds: projects.slice(0, 1).map(p => p.id),
    });
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Strategic Goals</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Connect high-level objectives to concrete skills, projects, milestones, and daily execution.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3 py-1.5 text-xs font-medium transition-all shadow-ambient-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(goal => {
          const linkedSkillItems = skills.filter(s => goal.linkedSkillIds?.includes(s.id));
          const linkedProjItems = projects.filter(p => goal.linkedProjectIds?.includes(p.id));

          return (
            <div
              key={goal.id}
              className="surface-card rounded-xl p-5 space-y-4 hover:border-white/[0.12] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-neutral-100">{goal.title}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {goal.description}
                    </p>
                  </div>
                  <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border border-white/[0.06] shrink-0">
                    {goal.category}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-500 text-[11px]">Progress</span>
                    <span className="text-neutral-300">{goal.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full bg-neutral-200 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div className="pt-2 space-y-2">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    Key Results ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length})
                  </div>
                  <div className="space-y-1.5">
                    {goal.milestones.map(m => (
                      <div
                        key={m.id}
                        onClick={() => toggleGoalMilestone(goal.id, m.id)}
                        className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer hover:text-neutral-200 transition-colors"
                      >
                        {m.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                        )}
                        <span className={`truncate text-xs ${m.completed ? 'line-through text-neutral-500' : 'text-neutral-300'}`}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Linked skills/projects */}
                {(linkedSkillItems.length > 0 || linkedProjItems.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {linkedSkillItems.map(s => (
                      <span
                        key={s.id}
                        className="flex items-center gap-1 rounded bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-neutral-400"
                      >
                        <GraduationCap className="h-3 w-3 text-neutral-500" />
                        {s.name}
                      </span>
                    ))}
                    {linkedProjItems.map(p => (
                      <span
                        key={p.id}
                        className="flex items-center gap-1 rounded bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-neutral-400"
                      >
                        <FolderGit2 className="h-3 w-3 text-neutral-500" />
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/[0.04] pt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>Target: <strong className="text-neutral-400 font-normal">{goal.targetDate}</strong></span>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-neutral-500 hover:text-rose-400 p-0.5 transition-colors"
                  title="Delete goal"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Goal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/[0.1] bg-[#0e1015] p-5 shadow-ambient-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-semibold text-neutral-100">Add Strategic Goal</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-500 hover:text-neutral-300 text-xs">✕</button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Production Multi-Agent Systems"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Why does this matter and what does success look like?"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
                  >
                    <option value="technical">Technical</option>
                    <option value="career">Career</option>
                    <option value="growth">Growth</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3.5 py-1.5 text-xs font-medium transition-all"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
