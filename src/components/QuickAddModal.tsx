import React, { useState } from 'react';
import {
  CheckSquare,
  GraduationCap,
  FolderGit2,
  Target,
  Calendar,
  Lightbulb,
  Bot,
  X,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { getLocalDateString } from '../utils/dateUtils';

interface QuickAddModalProps {
  onNavigateToAgent?: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ onNavigateToAgent }) => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    addTask,
    addSkill,
    addProject,
    addGoal,
    addCalendarItem,
    addStickyNote,
    sendChatMessage,
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'task' | 'skill' | 'project' | 'goal' | 'event' | 'note' | 'ai'>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState(getLocalDateString());

  if (!isQuickAddOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (activeTab === 'task') {
      addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'not_started',
        dueDate,
        subtasks: [],
        tags: [],
      });
    } else if (activeTab === 'skill') {
      addSkill(title.trim(), description.trim(), 'Engineering');
    } else if (activeTab === 'project') {
      addProject({
        name: title.trim(),
        description: description.trim(),
        status: 'active',
        deadline: dueDate,
        progress: 0,
        technologies: ['TypeScript'],
        milestones: [{ id: 'm1', title: 'Phase 1 MVP', completed: false, dueDate }],
        links: [],
        color: '#6366F1',
      });
    } else if (activeTab === 'goal') {
      addGoal({
        title: title.trim(),
        description: description.trim(),
        category: 'technical',
        targetDate: dueDate,
        progress: 0,
        milestones: [{ id: 'gm1', title: 'Milestone 1', completed: false, dueDate }],
        linkedSkillIds: [],
        linkedProjectIds: [],
      });
    } else if (activeTab === 'event') {
      addCalendarItem({
        title: title.trim(),
        date: dueDate,
        time: '14:00',
        durationMinutes: 45,
        type: 'task',
      });
    } else if (activeTab === 'note') {
      addStickyNote({
        title: title.trim(),
        content: description.trim(),
        color: '#FEF08A',
        isPinned: false,
        isCollapsed: false,
        opacity: 0.95,
        position: { x: 50, y: 150 },
        size: { width: 280, height: 180 },
        isFloatingOpen: false,
      });
    } else if (activeTab === 'ai') {
      sendChatMessage(title.trim());
      if (onNavigateToAgent) onNavigateToAgent();
    }

    setIsQuickAddOpen(false);
    setTitle('');
    setDescription('');
  };

  const tabs = [
    { id: 'task', label: 'Task', icon: CheckSquare },
    { id: 'skill', label: 'Skill', icon: GraduationCap },
    { id: 'project', label: 'Project', icon: FolderGit2 },
    { id: 'goal', label: 'Goal', icon: Target },
    { id: 'event', label: 'Event', icon: Calendar },
    { id: 'note', label: 'Note', icon: Lightbulb },
    { id: 'ai', label: 'Ask AI', icon: Bot },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0e1015] p-5 shadow-ambient-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="text-sm font-semibold text-neutral-100">Quick Add</h3>
          <button
            onClick={() => setIsQuickAddOpen(false)}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-950 font-medium shadow-ambient-sm'
                    : 'bg-white/[0.02] text-neutral-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-neutral-300 mb-1">
              {activeTab === 'ai' ? 'Instruction *' : 'Title *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                activeTab === 'ai'
                  ? 'Ask anything or command LifeOS...'
                  : activeTab === 'skill'
                  ? 'e.g. Distributed Systems Architecture'
                  : 'Title or name...'
              }
              className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {activeTab !== 'ai' && (
            <div>
              <label className="block text-xs text-neutral-300 mb-1">
                Details
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description or context..."
                className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
              />
            </div>
          )}

          {activeTab === 'task' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-300 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0b0c10] px-3 py-1.5 text-xs text-neutral-300 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(false)}
              className="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-neutral-100 hover:bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-950 transition-all shadow-ambient-sm"
            >
              {activeTab === 'ai' ? 'Send to Co-pilot' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
