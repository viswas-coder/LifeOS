import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Edit2,
  Check,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { AIMemoryItem } from '../types';

export const AIMemoryView: React.FC = () => {
  const { memory, addMemoryItem, updateMemoryItem, deleteMemoryItem, clearAllMemory } = useLifeOS();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // New Memory form
  const [newKey, setNewKey] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<AIMemoryItem['category']>('preferences');

  const handleStartEdit = (item: AIMemoryItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const handleSaveEdit = (id: string) => {
    updateMemoryItem(id, { content: editContent.trim() });
    setEditingId(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newContent.trim()) return;

    addMemoryItem({
      key: newKey.trim(),
      content: newContent.trim(),
      category: newCategory,
      enabled: true,
    });

    setIsAddModalOpen(false);
    setNewKey('');
    setNewContent('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">AI Memory Console</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Transparent, controllable memory store. Edit, toggle, or purge what LifeOS AI remembers about you.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3 py-1.5 text-xs font-medium transition-all shadow-ambient-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Memory</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all memories?')) {
                clearAllMemory();
              }
            }}
            className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-xs text-neutral-400 hover:text-rose-400 hover:border-rose-500/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Info Callout */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 flex items-start gap-3">
        <Info className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-neutral-400 leading-relaxed">
          <p className="font-medium text-neutral-200">How Memory Powers Your System</p>
          <p>
            Memories inform every task prioritization, skill roadmap, and daily coaching suggestion. If a memory is disabled or deleted, the AI immediately ceases taking it into account.
          </p>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memory.map(item => {
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 space-y-3 transition-all flex flex-col justify-between ${
                item.enabled
                  ? 'surface-card border-white/[0.06]'
                  : 'border-white/[0.04] bg-white/[0.01] opacity-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] font-mono text-neutral-300 uppercase tracking-wider">
                    {item.key}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateMemoryItem(item.id, { enabled: !item.enabled })}
                      className="text-neutral-400 hover:text-white transition-colors"
                      title={item.enabled ? 'Disable memory' : 'Enable memory'}
                    >
                      {item.enabled ? (
                        <ToggleRight className="h-5 w-5 text-neutral-200" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-neutral-600" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteMemoryItem(item.id)}
                      className="text-neutral-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={3}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.12] bg-[#0c0d12] p-2.5 text-xs text-neutral-100 focus:outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded px-2 py-1 text-[11px] text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="rounded bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-950 hover:bg-white flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-300 leading-relaxed pt-1">
                    {item.content}
                  </p>
                )}
              </div>

              <div className="border-t border-white/[0.04] pt-2.5 flex items-center justify-between text-[10px] text-neutral-500">
                <span className="capitalize font-mono">{item.category.replace('_', ' ')}</span>
                {!isEditing && (
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {memory.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-white/[0.06] p-12 text-center text-xs text-neutral-500">
            No memories stored. Click "Add Memory" to declare explicit guidelines, work preferences, or focus constraints for LifeOS AI.
          </div>
        )}
      </div>

      {/* Modal: Add Memory */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0e1015] p-5 shadow-ambient-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-semibold text-white">Add AI Memory Rule</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-500 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Key / Label *</label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  placeholder="e.g. Preferred Focus Hours"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-300 focus:outline-none"
                >
                  <option value="preferences">Preferences</option>
                  <option value="working_style">Working Style</option>
                  <option value="goals">Goals</option>
                  <option value="skills">Skills</option>
                  <option value="projects">Projects</option>
                  <option value="personality">Personality</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Guideline / Observation *</label>
                <textarea
                  rows={3}
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="e.g. Prefers 45-minute deep work blocks without interruptions in the morning."
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
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
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
