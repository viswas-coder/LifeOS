import React, { useState } from 'react';
import {
  FolderGit2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Plus,
  Code,
  Sparkles,
  Link2,
} from 'lucide-react';
import { Skill, SkillMasteryProject, Project } from '../../types';
import { ProgressBar } from '../common/ProgressBar';

interface SkillMasteryProjectsViewProps {
  skill: Skill;
  projects: Project[];
  onUpdateProject: (projectId: string, updates: Partial<SkillMasteryProject>) => void;
}

export const SkillMasteryProjectsView: React.FC<SkillMasteryProjectsViewProps> = ({
  skill,
  projects,
  onUpdateProject,
}) => {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [repoUrlInput, setRepoUrlInput] = useState('');
  const [evidenceNotesInput, setEvidenceNotesInput] = useState('');

  const masteryProjects = skill.masteryProjects || [];
  const completedCount = masteryProjects.filter(p => p.status === 'completed').length;
  const percentage = masteryProjects.length > 0 ? Math.round((completedCount / masteryProjects.length) * 100) : 0;

  const startEdit = (p: SkillMasteryProject) => {
    setEditingProjectId(p.id);
    setRepoUrlInput(p.repositoryUrl || '');
    setEvidenceNotesInput(p.evidenceNotes || '');
  };

  const saveEdit = (projectId: string) => {
    onUpdateProject(projectId, {
      repositoryUrl: repoUrlInput.trim() || undefined,
      evidenceNotes: evidenceNotesInput.trim() || undefined,
    });
    setEditingProjectId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4.5 space-y-3 shadow-ambient-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-zinc-400" />
              <span>Real-World Mastery Projects</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              True mastery requires tangible artifacts. Complete these 3 real-world projects to satisfy the practical application requirement.
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="font-mono text-sm font-semibold text-zinc-100">
              {completedCount} / {masteryProjects.length} Shipped
            </span>
          </div>
        </div>

        <ProgressBar
          percentage={percentage}
          label="Practical Project Milestone Progress"
          sublabel={`${completedCount} of ${masteryProjects.length} completed`}
          size="sm"
        />
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 gap-3.5">
        {masteryProjects.map((proj, idx) => {
          const isDone = proj.status === 'completed';
          const isEditing = editingProjectId === proj.id;

          return (
            <div
              key={proj.id}
              className={`rounded-xl border p-4.5 space-y-3 transition-all ${
                isDone
                  ? 'border-emerald-500/30 bg-zinc-900/80'
                  : 'border-zinc-800 bg-zinc-900/90 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() =>
                      onUpdateProject(proj.id, {
                        status: isDone ? 'in_progress' : 'completed',
                        completedAt: isDone ? undefined : new Date().toISOString().slice(0, 10),
                      })
                    }
                    className="mt-0.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-zinc-600" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                        Project 0{idx + 1}
                      </span>
                      <span className="rounded bg-zinc-800 border border-zinc-700/60 px-1.5 py-0.2 text-[9px] font-mono uppercase text-zinc-300">
                        {proj.difficulty}
                      </span>
                      {proj.status === 'completed' && (
                        <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-mono text-emerald-300">
                          Verified Complete
                        </span>
                      )}
                    </div>
                    <h4 className={`text-sm font-semibold ${isDone ? 'text-zinc-300' : 'text-zinc-100'}`}>
                      {proj.title}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                      {proj.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => (isEditing ? saveEdit(proj.id) : startEdit(proj))}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                  >
                    {isEditing ? 'Done' : 'Edit Artifact Link'}
                  </button>
                </div>
              </div>

              {/* Artifact details & links */}
              {isEditing ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Repository or Live URL
                    </label>
                    <input
                      type="url"
                      value={repoUrlInput}
                      onChange={e => setRepoUrlInput(e.target.value)}
                      placeholder="https://github.com/your-username/repo-name"
                      className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Evidence Notes & Technical Learnings
                    </label>
                    <textarea
                      rows={2}
                      value={evidenceNotesInput}
                      onChange={e => setEvidenceNotesInput(e.target.value)}
                      placeholder="Key challenges solved, architecture choices, benchmarking results..."
                      className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingProjectId(null)}
                      className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(proj.id)}
                      className="rounded bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1 text-xs font-medium"
                    >
                      Save Links
                    </button>
                  </div>
                </div>
              ) : (
                (proj.repositoryUrl || proj.evidenceNotes) && (
                  <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-2.5 text-xs space-y-1.5">
                    {proj.repositoryUrl && (
                      <div className="flex items-center gap-2">
                        <Code className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <a
                          href={proj.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-300 hover:text-white underline truncate text-[11px] flex items-center gap-1"
                        >
                          <span>{proj.repositoryUrl}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {proj.evidenceNotes && (
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        <strong className="text-zinc-300 font-normal">Evidence: </strong>
                        {proj.evidenceNotes}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          );
        })}

        {masteryProjects.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-xs text-zinc-400">
            No mastery projects generated yet. Click &quot;Adapt Roadmap&quot; or re-generate to create real-world project milestones.
          </div>
        )}
      </div>
    </div>
  );
};
