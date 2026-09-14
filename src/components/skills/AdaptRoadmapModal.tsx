import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, Sliders, ArrowRight } from 'lucide-react';
import { Skill } from '../../types';

interface AdaptRoadmapModalProps {
  isOpen: boolean;
  skill: Skill;
  onClose: () => void;
  onAdapt: (feedback: string) => Promise<void>;
}

export const AdaptRoadmapModal: React.FC<AdaptRoadmapModalProps> = ({
  isOpen,
  skill,
  onClose,
  onAdapt,
}) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdapt(feedback.trim());
      onClose();
      setFeedback('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickPrompts = [
    'I already know the fundamentals; condense Stage 1 and expand advanced distributed concurrency.',
    'Make the curriculum more project-driven with practical benchmarks.',
    'Emphasize security hardening, memory safety, and edge case resilience.',
    'Break down complex topics into smaller 20-minute digestible exercises.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-ambient-lg space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
              <Sliders className="h-4 w-4 text-zinc-200" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Adapt Curriculum with AI</h3>
              <p className="text-[10px] text-zinc-400 font-mono">{skill.name}</p>
            </div>
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
          Tell LifeOS AI how to reshape your syllabus. It will adjust topics, difficulty, and practice prompts while preserving your completed work.
        </p>

        {/* Quick presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Quick Directions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFeedback(p)}
                className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Your Custom Calibration / Instructions *
            </label>
            <textarea
              rows={3}
              required
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="e.g. Skip basic variables; focus on async tokio, channels, and performance optimization..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
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
              disabled={isSubmitting || !feedback.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Re-architecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Calibrate Roadmap</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
