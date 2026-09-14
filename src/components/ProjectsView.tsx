import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  CheckCircle2,
  Circle,
  ExternalLink,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { Project } from '../types';

export const ProjectsView: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject, toggleMilestone, tasks } = useLifeOS();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTech, setNewProjTech] = useState('');
  const [newProjDeadline, setNewProjDeadline] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    const techArray = newProjTech
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    addProject({
      name: newProjName.trim(),
      description: newProjDesc.trim(),
      status: 'active',
      deadline: newProjDeadline,
      progress: 0,
      technologies: techArray.length > 0 ? techArray : ['TypeScript', 'Node.js'],
      milestones: [
        { id: 'm1', title: 'Architecture design & schema specifications', completed: false, dueDate: newProjDeadline },
        { id: 'm2', title: 'Core implementation & engine dispatch', completed: false, dueDate: newProjDeadline },
        { id: 'm3', title: 'Unit tests, telemetry & deployment', completed: false, dueDate: newProjDeadline },
      ],
      links: [],
      color: '#6366F1',
    });

    setIsAddModalOpen(false);
    setNewProjName('');
    setNewProjDesc('');
    setNewProjTech('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Projects</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Structured initiatives, milestones, connected tech stacks, and active deliverables.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3 py-1.5 text-xs font-medium transition-all shadow-ambient-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(proj => {
          const projTasks = tasks.filter(t => t.projectId === proj.id);

          return (
            <div
              key={proj.id}
              className="surface-card rounded-xl p-5 space-y-4 hover:border-white/[0.12] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-neutral-100">{proj.name}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                  <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border border-white/[0.06] shrink-0">
                    {proj.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-500 text-[11px]">Progress</span>
                    <span className="text-neutral-300">{proj.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full bg-neutral-200 rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                {/* Technologies */}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.technologies.map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-white/[0.03] border border-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-neutral-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Milestones */}
                <div className="pt-2 space-y-2">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    Milestones ({proj.milestones.filter(m => m.completed).length}/{proj.milestones.length})
                  </div>
                  <div className="space-y-1.5">
                    {proj.milestones.map(m => (
                      <div
                        key={m.id}
                        onClick={() => toggleMilestone(proj.id, m.id)}
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
              </div>

              {/* Footer */}
              <div className="border-t border-white/[0.04] pt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>Due <strong className="text-neutral-400 font-normal">{proj.deadline}</strong></span>
                <div className="flex items-center gap-3">
                  <span>{projTasks.length} tasks</span>
                  <button
                    onClick={() => deleteProject(proj.id)}
                    className="text-neutral-500 hover:text-rose-400 p-0.5 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Project */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/[0.1] bg-[#0e1015] p-5 shadow-ambient-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-semibold text-neutral-100">Create New Project</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-500 hover:text-neutral-300 text-xs">✕</button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProjDesc}
                  onChange={e => setNewProjDesc(e.target.value)}
                  placeholder="Objective and technical scope..."
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={newProjTech}
                  onChange={e => setNewProjTech(e.target.value)}
                  placeholder="Rust, Tokio, gRPC, Protobuf"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={newProjDeadline}
                  onChange={e => setNewProjDeadline(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 focus:outline-none"
                />
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
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
