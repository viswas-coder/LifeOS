import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Code2,
  Copy,
  Check,
  Trash2,
  Layers,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLifeOS } from '../context/LifeOSContext';
import { KnowledgeEntry } from '../types';

export const KnowledgeBaseView: React.FC = () => {
  const { knowledge, addKnowledgeEntry, deleteKnowledgeEntry } = useLifeOS();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('AI Agents');
  const [newTags, setNewTags] = useState('');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');

  const categories = ['all', 'AI Agents', 'Systems', 'Architecture', 'General'];

  const filtered = knowledge.filter(k => {
    const matchesCat = selectedCategory === 'all' || k.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      k.title.toLowerCase().includes(search.toLowerCase()) ||
      k.content.toLowerCase().includes(search.toLowerCase()) ||
      k.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const tagArray = newTags.split(',').map(t => t.trim()).filter(Boolean);

    addKnowledgeEntry({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      tags: tagArray.length > 0 ? tagArray : ['reference'],
      codeSnippet: newCodeSnippet.trim() ? newCodeSnippet.trim() : undefined,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewCodeSnippet('');
    setNewTags('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Knowledge Base & References</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Personal engineering playbook, system architecture notes, and verified code patterns.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3 py-1.5 text-xs font-medium transition-all shadow-ambient-sm self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search concepts, patterns..."
            className="w-full rounded-lg border border-white/[0.08] bg-[#0c0d12] pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-white/[0.2]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-2.5 py-1 text-xs capitalize transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-neutral-100 text-neutral-950 font-medium'
                  : 'bg-white/[0.02] border border-white/[0.06] text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(entry => (
          <div
            key={entry.id}
            className="surface-card rounded-xl p-4 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-100">{entry.title}</h3>
                  <span className="rounded bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-neutral-300 mt-1 inline-block">
                    {entry.category}
                  </span>
                </div>
                <button
                  onClick={() => deleteKnowledgeEntry(entry.id)}
                  className="text-neutral-500 hover:text-rose-400 p-1 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="text-xs text-neutral-300 leading-relaxed prose prose-invert prose-xs max-w-none">
                <ReactMarkdown>{entry.content}</ReactMarkdown>
              </div>

              {/* Code Snippet if present */}
              {entry.codeSnippet && (
                <div className="rounded-lg border border-white/[0.06] bg-[#0c0d12] p-3 relative group">
                  <div className="flex items-center justify-between pb-1.5 text-[10px] font-mono text-neutral-400 border-b border-white/[0.04] mb-2">
                    <span className="flex items-center gap-1">
                      <Code2 className="h-3 w-3" />
                      Code Pattern
                    </span>
                    <button
                      onClick={() => handleCopyCode(entry.id, entry.codeSnippet!)}
                      className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                    >
                      {copiedSnippetId === entry.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-neutral-200 overflow-x-auto">
                    {entry.codeSnippet}
                  </pre>
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.04] pt-2.5 flex flex-wrap items-center justify-between text-[10px] text-neutral-500">
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((t, i) => (
                  <span key={i} className="rounded bg-white/[0.03] border border-white/[0.04] px-1.5 py-0.5 text-neutral-400 font-mono">
                    #{t}
                  </span>
                ))}
              </div>
              <span className="font-mono">Updated {entry.updatedAt.slice(0, 10)}</span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-white/[0.06] p-12 text-center text-xs text-neutral-500">
            No entries found matching your query.
          </div>
        )}
      </div>

      {/* Modal: Add Knowledge Entry */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#0e1015] p-5 shadow-ambient-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-semibold text-white">Add Knowledge Reference</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-500 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Lock Pattern with Redis Redlock"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-300 focus:outline-none"
                  >
                    <option value="AI Agents">AI Agents</option>
                    <option value="Systems">Systems & Concurrency</option>
                    <option value="Architecture">Architecture</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Tags</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder="consensus, redis, distributed"
                    className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Notes & Mental Model</label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Key trade-offs, principles, invariants..."
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Code Snippet (Optional)</label>
                <textarea
                  rows={3}
                  value={newCodeSnippet}
                  onChange={e => setNewCodeSnippet(e.target.value)}
                  placeholder="// Paste reference implementation or schema..."
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-100 hover:bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-950 transition-all"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
