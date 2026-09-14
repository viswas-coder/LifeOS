import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, BookOpen, Layers, Target, Clock, Zap } from 'lucide-react';
import { SKILL_CATEGORIES, SKILL_LEVELS } from '../../data/skillCategories';
import { GenerateRoadmapOptions } from '../../services/aiService';
import { Project, Goal } from '../../types';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, category: string, options?: GenerateRoadmapOptions) => Promise<void>;
  projects: Project[];
  goals: Goal[];
}

export const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
  goals,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(SKILL_CATEGORIES[0].id);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(
    SKILL_CATEGORIES[0].subcategories[0]?.id || ''
  );
  const [currentLevel, setCurrentLevel] = useState('beginner');
  const [learningStyle, setLearningStyle] = useState<'hands_on' | 'theory_first' | 'project_based' | 'comprehensive'>('hands_on');
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [linkedProjectId, setLinkedProjectId] = useState<string>('');
  const [linkedGoalId, setLinkedGoalId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentCategoryGroup = SKILL_CATEGORIES.find(g => g.id === selectedGroupId) || SKILL_CATEGORIES[0];

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    const group = SKILL_CATEGORIES.find(g => g.id === groupId);
    if (group && group.subcategories.length > 0) {
      setSelectedSubcategoryId(group.subcategories[0].id);
      if (!name) {
        setName(group.subcategories[0].name);
        setDescription(group.subcategories[0].suggestedPrompt);
      }
    }
  };

  const handleSubcategoryChange = (subId: string) => {
    setSelectedSubcategoryId(subId);
    const sub = currentCategoryGroup.subcategories.find(s => s.id === subId);
    if (sub) {
      setName(sub.name);
      setDescription(sub.suggestedPrompt);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const options: GenerateRoadmapOptions = {
        category: currentCategoryGroup.name,
        subcategory: currentCategoryGroup.subcategories.find(s => s.id === selectedSubcategoryId)?.name,
        currentLevel: currentLevel as any,
        primaryGoal: primaryGoal.trim() || undefined,
        learningStyle,
        weeklyHours: hoursPerWeek,
        linkedProjectId: linkedProjectId || undefined,
        linkedGoalId: linkedGoalId || undefined,
      };

      await onSubmit(name.trim(), description.trim(), currentCategoryGroup.name, options);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-ambient-lg space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
              <Sparkles className="h-4 w-4 text-zinc-200" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Add New Skill to Master</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          LifeOS AI will design a 5-stage progressive syllabus (Foundations → Core → Intermediate → Advanced → Mastery) with 3 real-world practical projects.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Domain Category
              </label>
              <select
                value={selectedGroupId}
                onChange={e => handleGroupChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              >
                {SKILL_CATEGORIES.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Subcategory / Discipline
              </label>
              <select
                value={selectedSubcategoryId}
                onChange={e => handleSubcategoryChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              >
                {currentCategoryGroup.subcategories.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Skill Name & Description */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              Skill Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Distributed Systems, Rust, Systems Architecture..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              Target Scope & Ambition
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What specifically do you want to be able to build, design, or solve?"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Starting Level & Learning Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Current Level
              </label>
              <select
                value={currentLevel}
                onChange={e => setCurrentLevel(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              >
                {SKILL_LEVELS.map(lvl => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Pedagogical Style
              </label>
              <select
                value={learningStyle}
                onChange={e => setLearningStyle(e.target.value as any)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              >
                <option value="hands_on">Hands-on Exercises & Challenges</option>
                <option value="project_based">Project-Driven & Portfolios</option>
                <option value="theory_first">First-Principles & Architecture</option>
                <option value="comprehensive">Comprehensive Academic & Practical</option>
              </select>
            </div>
          </div>

          {/* Weekly Hours & Primary Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Weekly Hours
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={hoursPerWeek}
                onChange={e => setHoursPerWeek(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Primary Goal / Desired Outcome
              </label>
              <input
                type="text"
                value={primaryGoal}
                onChange={e => setPrimaryGoal(e.target.value)}
                placeholder="e.g. Build production microservices engine"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Optional: Link to Existing Projects or Goals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800/80">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Link to LifeOS Project (Optional)
              </label>
              <select
                value={linkedProjectId}
                onChange={e => setLinkedProjectId(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="">-- None --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Link to LifeOS Goal (Optional)
              </label>
              <select
                value={linkedGoalId}
                onChange={e => setLinkedGoalId(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="">-- None --</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-1.5 text-xs font-medium transition-all disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing Syllabus...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate 5-Stage Roadmap</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
