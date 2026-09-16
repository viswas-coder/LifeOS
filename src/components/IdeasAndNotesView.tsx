import React, { useState } from 'react';
import {
  Lightbulb,
  Plus,
  Pin,
  Minimize2,
  Maximize2,
  Trash2,
  ArrowRight,
  Sparkles,
  CheckSquare,
  FolderGit2,
  Target,
  FileText,
  Palette,
  Flame,
  ExternalLink,
  ListTodo,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { StickyNote, IdeaItem } from '../types';

export const IdeasAndNotesView: React.FC = () => {
  const {
    stickyNotes,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    openDailyProgressStickyNote,
    ideas,
    addIdea,
    convertIdea,
    deleteIdea,
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'notes' | 'ideas'>('notes');
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaDesc, setNewIdeaDesc] = useState('');
  const [newIdeaTags, setNewIdeaTags] = useState('');

  const colors = [
    { name: 'Oat', hex: '#1c1a17', text: '#d6cdbe' },
    { name: 'Sage', hex: '#161d19', text: '#c2d6cb' },
    { name: 'Slate', hex: '#161920', text: '#c6cfde' },
    { name: 'Dusk', hex: '#1d171c', text: '#d6c5d4' },
    { name: 'Sand', hex: '#1a1815', text: '#d9d0c1' },
  ];

  const handleCreateNote = () => {
    addStickyNote({
      title: 'Quick Scratchpad',
      content: '',
      color: colors[stickyNotes.length % colors.length].hex,
      isPinned: false,
      isCollapsed: false,
      opacity: 0.95,
      position: { x: 40, y: 120 },
      size: { width: 280, height: 200 },
      isFloatingOpen: false,
    });
  };

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) return;
    const tagArray = newIdeaTags.split(',').map(t => t.trim()).filter(Boolean);

    addIdea({
      title: newIdeaTitle.trim(),
      description: newIdeaDesc.trim(),
      category: 'technical',
      status: 'inbox',
      tags: tagArray.length > 0 ? tagArray : ['concept'],
    });

    setNewIdeaTitle('');
    setNewIdeaDesc('');
    setNewIdeaTags('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Idea Vault & Notes</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Capture spontaneous thoughts, manage floating scratchpads, and convert concepts into execution tracks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/[0.03] p-1 rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'notes' ? 'bg-neutral-100 text-neutral-950 shadow-ambient-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Notes ({stickyNotes.length})
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'ideas' ? 'bg-neutral-100 text-neutral-950 shadow-ambient-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Vault ({ideas.length})
            </button>
          </div>

          {activeTab === 'notes' && (
            <div className="flex items-center gap-2">
              <button
                onClick={openDailyProgressStickyNote}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
                title="Launch floating sticky note that tracks your daily progress and can float across other tabs"
              >
                <Flame className="h-3.5 w-3.5 text-emerald-400" />
                <span>Launch Floating Daily Note</span>
              </button>

              <button
                onClick={handleCreateNote}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3 py-1.5 text-xs font-medium transition-all shadow-ambient-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Note</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: STICKY NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Quick Floating sticky note info bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2.5 text-xs text-neutral-300">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ExternalLink className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-neutral-200">Always-On-Top Floating Notes: </span>
                <span className="text-neutral-400">
                  Track your daily progress checklist and scratchpad notes across any window tab, even after minimizing LifeOS.
                </span>
              </div>
            </div>

            <button
              onClick={openDailyProgressStickyNote}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-neutral-200 transition-colors"
            >
              <ListTodo className="h-3.5 w-3.5 text-emerald-400" />
              <span>{stickyNotes.some(n => n.isFloatingOpen) ? 'Show Active Floating Note' : 'Open Floating Note'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stickyNotes.map(note => {
            return (
              <div
                key={note.id}
                className="rounded-xl p-4 shadow-ambient flex flex-col justify-between transition-all min-h-[200px] border border-white/[0.08]"
                style={{
                  backgroundColor: note.color.startsWith('#1') || note.color.startsWith('#2') ? note.color : '#181a20',
                  opacity: note.opacity || 1,
                }}
              >
                {/* Note Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <input
                    type="text"
                    value={note.title}
                    onChange={e => updateStickyNote(note.id, { title: e.target.value })}
                    className="bg-transparent font-medium text-xs text-neutral-200 focus:outline-none w-full"
                    placeholder="Note Title"
                  />
                  <div className="flex items-center gap-1 text-neutral-400">
                    <button
                      onClick={() => updateStickyNote(note.id, { isPinned: !note.isPinned })}
                      className={`p-1 rounded hover:bg-white/[0.06] ${note.isPinned ? 'text-white' : ''}`}
                      title={note.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => updateStickyNote(note.id, { isCollapsed: !note.isCollapsed })}
                      className="p-1 rounded hover:bg-white/[0.06] hover:text-white"
                    >
                      {note.isCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteStickyNote(note.id)}
                      className="p-1 rounded hover:bg-white/[0.06] hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Note Body */}
                {!note.isCollapsed && (
                  <textarea
                    rows={4}
                    value={note.content}
                    onChange={e => updateStickyNote(note.id, { content: e.target.value })}
                    placeholder="Write temporary reminders, code snippets, or thoughts..."
                    className="w-full flex-1 bg-transparent text-xs text-neutral-300 placeholder-neutral-500 resize-none focus:outline-none py-2 leading-relaxed"
                  />
                )}

                {/* Color Chooser & Floating Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-neutral-400">
                  <div className="flex items-center gap-1">
                    {colors.map(c => (
                      <button
                        key={c.name}
                        onClick={() => updateStickyNote(note.id, { color: c.hex })}
                        className="h-3 w-3 rounded-full border border-white/[0.2]"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => updateStickyNote(note.id, { isFloatingOpen: !note.isFloatingOpen })}
                    className="rounded bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] font-mono hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    {note.isFloatingOpen ? 'Dock' : 'Float on Screen'}
                  </button>
                </div>
              </div>
            );
          })}

          {stickyNotes.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-white/[0.06] p-12 text-center text-xs text-neutral-500">
              No sticky notes yet. Click "+ New Note" to create one.
            </div>
          )}
          </div>
        </div>
      )}

      {/* TAB 2: IDEA VAULT */}
      {activeTab === 'ideas' && (
        <div className="space-y-6">
          {/* Idea Capture Form */}
          <form
            onSubmit={handleCreateIdea}
            className="surface-card rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
              <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
              <span>Capture Concept or Idea</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={newIdeaTitle}
                onChange={e => setNewIdeaTitle(e.target.value)}
                placeholder="Idea concept or hypothesis..."
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
              />
              <input
                type="text"
                value={newIdeaTags}
                onChange={e => setNewIdeaTags(e.target.value)}
                placeholder="Tags (e.g. AI, product, systems)..."
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
              />
            </div>

            <textarea
              rows={2}
              value={newIdeaDesc}
              onChange={e => setNewIdeaDesc(e.target.value)}
              placeholder="Elaborate on rationale, potential impact, or architectural sketch..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3.5 py-1.5 text-xs font-medium transition-all"
              >
                Store in Vault
              </button>
            </div>
          </form>

          {/* Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.map(idea => (
              <div
                key={idea.id}
                className="surface-card rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-white/[0.12] transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-neutral-200">{idea.title}</h4>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase ${
                        idea.status === 'converted'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/[0.04] text-neutral-400 border border-white/[0.06]'
                      }`}
                    >
                      {idea.status}
                    </span>
                  </div>

                  {idea.description && (
                    <p className="text-xs text-neutral-400 leading-relaxed">{idea.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1 pt-1">
                    {idea.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 border border-white/[0.04]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Conversion actions */}
                <div className="border-t border-white/[0.04] pt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-mono text-neutral-500">
                    Convert To:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => convertIdea(idea.id, 'task')}
                      className="flex items-center gap-1 rounded bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
                      title="Convert to Task"
                    >
                      <CheckSquare className="h-3 w-3" />
                      <span>Task</span>
                    </button>
                    <button
                      onClick={() => convertIdea(idea.id, 'project')}
                      className="flex items-center gap-1 rounded bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
                      title="Convert to Project"
                    >
                      <FolderGit2 className="h-3 w-3" />
                      <span>Project</span>
                    </button>
                    <button
                      onClick={() => convertIdea(idea.id, 'goal')}
                      className="flex items-center gap-1 rounded bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
                      title="Convert to Goal"
                    >
                      <Target className="h-3 w-3" />
                      <span>Goal</span>
                    </button>
                    <button
                      onClick={() => convertIdea(idea.id, 'note')}
                      className="flex items-center gap-1 rounded bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
                      title="Convert to Sticky Note"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Note</span>
                    </button>
                    <button
                      onClick={() => deleteIdea(idea.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 ml-1 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
