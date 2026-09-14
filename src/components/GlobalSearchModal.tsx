import React, { useEffect, useRef } from 'react';
import {
  Search,
  CheckSquare,
  GraduationCap,
  FolderGit2,
  Target,
  BookOpen,
  Lightbulb,
  X,
  ArrowRight,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';

interface GlobalSearchModalProps {
  onNavigate: (view: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onNavigate }) => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    tasks,
    skills,
    projects,
    goals,
    knowledge,
    ideas,
  } = useLifeOS();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const q = searchQuery.toLowerCase().trim();

  const matchedTasks = q ? tasks.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedSkills = q ? skills.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedProjects = q ? projects.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedGoals = q ? goals.filter(g => g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedKnowledge = q ? knowledge.filter(k => k.title.toLowerCase().includes(q) || k.content.toLowerCase().includes(q)).slice(0, 3) : [];

  const totalMatches =
    matchedTasks.length +
    matchedSkills.length +
    matchedProjects.length +
    matchedGoals.length +
    matchedKnowledge.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm p-4 pt-20">
      <div className="w-full max-w-xl rounded-xl border border-white/[0.08] bg-[#0e1015] shadow-ambient-lg overflow-hidden space-y-2">
        {/* Search Input Bar */}
        <div className="flex items-center px-3.5 py-2.5 border-b border-white/[0.06] gap-2.5">
          <Search className="h-4 w-4 text-neutral-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks, skills, projects, notes..."
            className="w-full bg-transparent text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-neutral-500 hover:text-white p-1 rounded transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[55vh] overflow-y-auto px-3.5 pb-3 space-y-3">
          {!q && (
            <div className="py-6 text-center text-xs text-neutral-500 font-mono">
              Type to query across tasks, skills, and knowledge...
            </div>
          )}

          {q && totalMatches === 0 && (
            <div className="py-6 text-center text-xs text-neutral-500">
              No matches found for "{searchQuery}".
            </div>
          )}

          {/* Tasks */}
          {matchedTasks.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Tasks
              </span>
              {matchedTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    setIsSearchOpen(false);
                    onNavigate('tasks');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="font-medium text-neutral-200">{t.title}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-neutral-500" />
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {matchedSkills.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Skills
              </span>
              {matchedSkills.map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    setIsSearchOpen(false);
                    onNavigate('skills');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="font-medium text-neutral-200">{s.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400">{s.currentMastery}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {matchedProjects.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Projects
              </span>
              {matchedProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setIsSearchOpen(false);
                    onNavigate('projects');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="font-medium text-neutral-200">{p.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-500">{p.progress}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Knowledge */}
          {matchedKnowledge.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Knowledge Base
              </span>
              {matchedKnowledge.map(k => (
                <div
                  key={k.id}
                  onClick={() => {
                    setIsSearchOpen(false);
                    onNavigate('knowledge_base');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="font-medium text-neutral-200">{k.title}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">{k.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-3.5 py-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-neutral-500">
          <span className="font-mono text-[10px]">Esc to dismiss</span>
          <kbd className="font-mono bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-neutral-400 text-[10px]">
            ⌘K
          </kbd>
        </div>
      </div>
    </div>
  );
};
