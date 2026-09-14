import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Minimize2,
  Maximize2,
  Pin,
  Palette,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ListTodo,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Flame,
  GripVertical,
  Layers,
  ArrowDownToLine,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { StickyNote, Task, Priority } from '../types';
import { useLifeOS } from '../context/LifeOSContext';
import { playTaskCompleteSound } from '../utils/sound';

interface FloatingStickyNoteProps {
  note: StickyNote;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Zinc Dark', hex: '#18181b', border: '#27272a' },
  { name: 'Obsidian', hex: '#0f172a', border: '#1e293b' },
  { name: 'Warm Amber', hex: '#261b0d', border: '#452b14' },
  { name: 'Emerald Night', hex: '#06281e', border: '#0f4837' },
  { name: 'Indigo Deep', hex: '#1e1b4b', border: '#312e81' },
  { name: 'Crimson Velvet', hex: '#2b1019', border: '#4a1928' },
];

const OPACITY_STEPS = [1.0, 0.88, 0.72];

export const FloatingStickyNote: React.FC<FloatingStickyNoteProps> = ({ note, onClose }) => {
  const {
    tasks,
    addTask,
    toggleTaskComplete,
    updateStickyNote,
    deleteStickyNote,
  } = useLifeOS();

  // Local state
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>(note.mode === 'notes' ? 'notes' : 'tasks');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  // Picture-in-Picture window reference
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  // Dragging state for in-tab floating
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; noteX: number; noteY: number }>({
    mouseX: 0,
    mouseY: 0,
    noteX: note.position?.x || 100,
    noteY: note.position?.y || 100,
  });

  // Today's ISO date string (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter tasks relevant for today's daily progress
  const dailyTasks = useMemo(() => {
    // If note is configured to track daily progress:
    // Gather today's tasks + tasks due today or without due date that are in progress
    const todayTasksList = tasks.filter(t => {
      if (t.dueDate === todayStr) return true;
      if (!t.dueDate && t.status !== 'completed') return true;
      if (t.status === 'in_progress') return true;
      return false;
    });

    // If there are zero tasks matching today, fallback to all uncompleted tasks
    const relevantTasks = todayTasksList.length > 0
      ? todayTasksList
      : tasks.slice(0, 8);

    if (taskFilter === 'pending') {
      return relevantTasks.filter(t => t.status !== 'completed');
    }
    if (taskFilter === 'completed') {
      return relevantTasks.filter(t => t.status === 'completed');
    }
    return relevantTasks;
  }, [tasks, todayStr, taskFilter]);

  // Overall completion metrics for today
  const dailyStats = useMemo(() => {
    const todayTasks = tasks.filter(t => t.dueDate === todayStr || (!t.dueDate && t.status !== 'archived'));
    const total = todayTasks.length > 0 ? todayTasks.length : Math.max(1, tasks.length);
    const completed = todayTasks.length > 0
      ? todayTasks.filter(t => t.status === 'completed').length
      : tasks.filter(t => t.status === 'completed').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [tasks, todayStr]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (pipWindow) return; // not draggable inside PiP
    if ((e.target as HTMLElement).closest('button, input, textarea, a, select')) return;

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      noteX: note.position?.x ?? 100,
      noteY: note.position?.y ?? 100,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      const maxX = Math.max(0, window.innerWidth - (note.size?.width || 340));
      const maxY = Math.max(0, window.innerHeight - 60);

      const newX = Math.min(Math.max(10, dragStartRef.current.noteX + dx), maxX);
      const newY = Math.min(Math.max(10, dragStartRef.current.noteY + dy), maxY);

      updateStickyNote(note.id, {
        position: { x: newX, y: newY },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, note.id, note.size?.width, updateStickyNote]);

  // Add a task directly from the sticky note
  const handleAddNewTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      status: 'not_started',
      dueDate: todayStr,
      tags: ['daily-focus'],
      subtasks: [],
    });

    setNewTaskTitle('');
  };

  // Toggle task completion with audio feedback
  const handleToggleTask = (taskId: string) => {
    playTaskCompleteSound();
    toggleTaskComplete(taskId);
  };

  // Cycle Opacity
  const handleCycleOpacity = () => {
    const currentOpacity = note.opacity || 1.0;
    const currentIndex = OPACITY_STEPS.findIndex(op => Math.abs(op - currentOpacity) < 0.05);
    const nextIndex = (currentIndex + 1) % OPACITY_STEPS.length;
    updateStickyNote(note.id, { opacity: OPACITY_STEPS[nextIndex] });
  };

  // Copy content to clipboard
  const handleCopy = () => {
    let textToCopy = `📋 ${note.title || 'Daily Progress'}\n`;
    textToCopy += `Daily Progress: ${dailyStats.completed}/${dailyStats.total} (${dailyStats.percent}%)\n\n`;
    textToCopy += `Tasks:\n` + dailyTasks.map(t => `${t.status === 'completed' ? '✓' : '○'} ${t.title}`).join('\n');
    if (note.content) {
      textToCopy += `\n\nNotes:\n${note.content}`;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- PICTURE-IN-PICTURE (FLOAT ACROSS TABS & DESKTOP) ---
  const handleTogglePictureInPicture = async () => {
    // If PiP is currently open, close it
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      pipWindowRef.current = null;
      updateStickyNote(note.id, { isExternalPiPOpen: false });
      return;
    }

    // Try modern Document Picture-in-Picture API
    if ('documentPictureInPicture' in window) {
      try {
        const dpip = (window as any).documentPictureInPicture;
        const win = await dpip.requestWindow({
          width: note.size?.width || 360,
          height: note.size?.height || 500,
          disallowReturnToOpener: false,
        });

        // Copy all CSS style sheets and link tags from main document to PiP document
        Array.from(document.styleSheets).forEach(styleSheet => {
          try {
            const cssRules = Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('');
            const style = win.document.createElement('style');
            style.textContent = cssRules;
            win.document.head.appendChild(style);
          } catch {
            if (styleSheet.href) {
              const link = win.document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              win.document.head.appendChild(link);
            }
          }
        });

        // Ensure fonts and dark background styling match
        win.document.title = `${note.title || 'LifeOS Daily Progress Note'}`;
        win.document.body.className = 'bg-zinc-950 text-zinc-100 font-sans antialiased m-0 p-0 overflow-hidden';

        const container = win.document.createElement('div');
        container.id = 'pip-sticky-note-root';
        container.className = 'h-screen w-screen flex flex-col overflow-hidden';
        win.document.body.appendChild(container);

        win.addEventListener('pagehide', () => {
          setPipWindow(null);
          pipWindowRef.current = null;
          updateStickyNote(note.id, { isExternalPiPOpen: false });
        });

        setPipWindow(win);
        pipWindowRef.current = win;
        updateStickyNote(note.id, { isExternalPiPOpen: true });
        return;
      } catch (err) {
        console.warn('Document Picture-in-Picture not granted or failed, falling back to Popout window:', err);
      }
    }

    // Fallback: Standalone Compact Popout Window
    try {
      const popout = window.open(
        '',
        `lifeos_note_${note.id}`,
        `width=${note.size?.width || 360},height=${note.size?.height || 500},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
      );

      if (popout) {
        // Copy styles
        Array.from(document.styleSheets).forEach(styleSheet => {
          try {
            const cssRules = Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('');
            const style = popout.document.createElement('style');
            style.textContent = cssRules;
            popout.document.head.appendChild(style);
          } catch {
            if (styleSheet.href) {
              const link = popout.document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              popout.document.head.appendChild(link);
            }
          }
        });

        popout.document.title = `${note.title || 'LifeOS Daily Progress Note'}`;
        popout.document.body.className = 'bg-zinc-950 text-zinc-100 font-sans antialiased m-0 p-0 overflow-hidden';

        const container = popout.document.createElement('div');
        container.id = 'pip-sticky-note-root';
        container.className = 'h-screen w-screen flex flex-col overflow-hidden';
        popout.document.body.appendChild(container);

        popout.addEventListener('beforeunload', () => {
          setPipWindow(null);
          pipWindowRef.current = null;
          updateStickyNote(note.id, { isExternalPiPOpen: false });
        });

        setPipWindow(popout);
        pipWindowRef.current = popout;
        updateStickyNote(note.id, { isExternalPiPOpen: true });
      }
    } catch (popoutErr) {
      console.error('Could not open detached window:', popoutErr);
    }
  };

  // Clean up PiP window on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        try {
          pipWindowRef.current.close();
        } catch {}
      }
    };
  }, []);

  // --- RENDER CONTENT COMPONENT ---
  const renderNoteContent = (isInPiPWindow: boolean) => {
    return (
      <div
        className={`flex flex-col h-full w-full rounded-xl select-none overflow-hidden transition-colors border shadow-2xl ${
          isInPiPWindow ? 'border-zinc-800 h-screen' : 'border-zinc-800/90'
        }`}
        style={{
          backgroundColor: note.color || '#18181b',
          opacity: isInPiPWindow ? 1.0 : note.opacity || 0.98,
        }}
      >
        {/* HEADER & DRAG HANDLE */}
        <div
          onMouseDown={isInPiPWindow ? undefined : handleMouseDown}
          className={`flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-black/20 ${
            isInPiPWindow ? '' : 'cursor-grab active:cursor-grabbing'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
            {!isInPiPWindow && (
              <GripVertical className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            )}
            <input
              type="text"
              value={note.title || 'Daily Progress'}
              onChange={e => updateStickyNote(note.id, { title: e.target.value })}
              className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none truncate w-full tracking-tight"
              placeholder="Note Title"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0 text-zinc-400">
            {/* Float Across Tabs (Picture-in-Picture) Button */}
            <button
              onClick={handleTogglePictureInPicture}
              className={`p-1 rounded transition-colors ${
                isInPiPWindow
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'hover:bg-white/[0.08] hover:text-white'
              }`}
              title={
                isInPiPWindow
                  ? 'Return to LifeOS tab'
                  : 'Float across other tabs & desktop (Always-On-Top PiP)'
              }
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>

            {/* Opacity Cycle */}
            <button
              onClick={handleCycleOpacity}
              className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors"
              title={`Opacity: ${Math.round((note.opacity || 1) * 100)}% (Click to toggle)`}
            >
              <Sliders className="h-3.5 w-3.5" />
            </button>

            {/* Palette */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors"
                title="Change theme color"
              >
                <Palette className="h-3.5 w-3.5" />
              </button>

              {showColorPicker && (
                <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-750 p-2 rounded-lg shadow-xl z-50 flex gap-1.5">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => {
                        updateStickyNote(note.id, { color: c.hex });
                        setShowColorPicker(false);
                      }}
                      className="h-4 w-4 rounded-full border border-white/20 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Minimize / Collapse */}
            {!isInPiPWindow && (
              <button
                onClick={() => updateStickyNote(note.id, { isCollapsed: !note.isCollapsed })}
                className="p-1 rounded hover:bg-white/[0.08] hover:text-white transition-colors"
                title={note.isCollapsed ? 'Expand Note' : 'Collapse to Mini-Bar'}
              >
                {note.isCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
            )}

            {/* Close / Dock */}
            <button
              onClick={() => {
                if (pipWindow) {
                  pipWindow.close();
                }
                updateStickyNote(note.id, { isFloatingOpen: false, isExternalPiPOpen: false });
                onClose();
              }}
              className="p-1 rounded hover:bg-white/[0.08] hover:text-rose-400 transition-colors"
              title="Close floating note"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* COLLAPSED MINI STATE */}
        {note.isCollapsed && !isInPiPWindow ? (
          <div
            onClick={() => updateStickyNote(note.id, { isCollapsed: false })}
            className="px-3 py-2 flex items-center justify-between text-[11px] cursor-pointer hover:bg-white/[0.04]"
          >
            <span className="text-zinc-300 font-medium truncate">
              {dailyStats.completed}/{dailyStats.total} Tasks Completed
            </span>
            <span className="font-mono text-emerald-400 font-semibold">{dailyStats.percent}%</span>
          </div>
        ) : (
          /* EXPANDED CONTENT BODY */
          <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden">
            {/* DAILY PROGRESS BANNER */}
            <div className="px-3 pt-2.5 pb-2 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Flame className={`h-3.5 w-3.5 ${dailyStats.percent === 100 ? 'text-amber-400 fill-amber-400' : 'text-emerald-400'}`} />
                  <span className="font-medium text-zinc-200">Daily Progress</span>
                  {isInPiPWindow && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono bg-emerald-500/20 text-emerald-400 rounded-full">
                      Always on Top
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {dailyStats.completed}/{dailyStats.total}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-100">
                    {dailyStats.percent}%
                  </span>
                </div>
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-400"
                  style={{ width: `${Math.min(100, Math.max(0, dailyStats.percent))}%` }}
                />
              </div>

              {/* TAB SELECTOR */}
              <div className="flex items-center justify-between mt-2.5 pt-1">
                <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg border border-white/[0.06]">
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      activeTab === 'tasks'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ListTodo className="h-3 w-3" />
                    <span>Tasks ({dailyTasks.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      activeTab === 'notes'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                    <span>Notes</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] rounded transition-colors"
                    title="Copy note and tasks"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'tasks' ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Task Filter Pills */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04] text-[10px] text-zinc-400 bg-black/10">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTaskFilter('all')}
                      className={`px-1.5 py-0.5 rounded ${taskFilter === 'all' ? 'text-zinc-100 font-semibold' : 'hover:text-zinc-300'}`}
                    >
                      All
                    </button>
                    <span>·</span>
                    <button
                      onClick={() => setTaskFilter('pending')}
                      className={`px-1.5 py-0.5 rounded ${taskFilter === 'pending' ? 'text-zinc-100 font-semibold' : 'hover:text-zinc-300'}`}
                    >
                      Pending
                    </button>
                    <span>·</span>
                    <button
                      onClick={() => setTaskFilter('completed')}
                      className={`px-1.5 py-0.5 rounded ${taskFilter === 'completed' ? 'text-zinc-100 font-semibold' : 'hover:text-zinc-300'}`}
                    >
                      Done
                    </button>
                  </div>

                  <span className="text-[9px] text-zinc-500 font-mono">
                    {dailyStats.percent === 100 ? 'Goal Completed 🎉' : 'In Progress'}
                  </span>
                </div>

                {/* Task Checklist Items (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin">
                  {dailyTasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        className={`group flex items-start gap-2 p-1.5 rounded-lg border transition-all ${
                          isCompleted
                            ? 'bg-white/[0.01] border-transparent opacity-60'
                            : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1]'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="mt-0.5 text-zinc-400 hover:text-emerald-400 transition-colors shrink-0"
                          title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs leading-snug break-words ${
                              isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.priority === 'urgent' && (
                            <span className="inline-block mt-0.5 px-1 py-0.2 text-[9px] font-medium bg-rose-500/20 text-rose-300 rounded">
                              Urgent
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {dailyTasks.length === 0 && (
                    <div className="py-6 text-center text-xs text-zinc-500">
                      {taskFilter === 'pending'
                        ? 'All tasks completed for today! Great job! ✨'
                        : 'No tasks scheduled. Add one below to track your daily progress.'}
                    </div>
                  )}
                </div>

                {/* Quick Add Task Input at Bottom */}
                <form
                  onSubmit={handleAddNewTask}
                  className="p-2.5 border-t border-white/[0.08] bg-black/25 flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Add task for today... (Enter)"
                    className="flex-1 bg-zinc-900/90 border border-zinc-750 text-xs text-zinc-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-zinc-500 placeholder-zinc-500"
                  />
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as Priority)}
                    className="bg-zinc-900 border border-zinc-750 text-[10px] text-zinc-300 rounded-lg px-1.5 py-1.5 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Med</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="p-1.5 bg-zinc-200 hover:bg-white text-zinc-950 disabled:opacity-40 rounded-lg text-xs font-semibold transition-colors shrink-0"
                    title="Add task"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            ) : (
              /* SCRATCHPAD NOTES TAB */
              <div className="flex-1 flex flex-col min-h-0 p-2.5">
                <textarea
                  value={note.content}
                  onChange={e => updateStickyNote(note.id, { content: e.target.value })}
                  placeholder="Type temporary thoughts, links, code snippets, or daily reflections here..."
                  className="w-full flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none leading-relaxed p-1 font-sans"
                />
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{(note.content || '').length} characters</span>
                  <span>Auto-saved to LifeOS</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // If in Picture-in-Picture window, render the interactive content inside the PiP window via portal!
  if (pipWindow) {
    const pipRoot = pipWindow.document.getElementById('pip-sticky-note-root');
    return (
      <>
        {/* Placeholder in the main LifeOS window informing user it's floating across tabs */}
        <div
          className="pointer-events-auto absolute rounded-xl p-3 shadow-xl border border-emerald-500/30 bg-zinc-900/95 backdrop-blur flex flex-col gap-2 z-40 transition-all text-xs"
          style={{
            left: `${note.position?.x || 100}px`,
            top: `${note.position?.y || 100}px`,
            width: `${note.size?.width || 340}px`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Floating in Picture-in-Picture</span>
            </div>
            <button
              onClick={() => {
                if (pipWindow) pipWindow.close();
                setPipWindow(null);
                updateStickyNote(note.id, { isExternalPiPOpen: false });
              }}
              className="text-zinc-400 hover:text-white p-1"
              title="Bring back to tab"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            This sticky note is floating over your other tabs, desktop & apps even if LifeOS is minimized.
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <span className="text-[10px] text-zinc-500">
              {dailyStats.completed}/{dailyStats.total} Tasks Completed ({dailyStats.percent}%)
            </span>
            <button
              onClick={() => {
                if (pipWindow) pipWindow.close();
                setPipWindow(null);
                updateStickyNote(note.id, { isExternalPiPOpen: false });
              }}
              className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-medium transition-colors"
            >
              Dock to Tab
            </button>
          </div>
        </div>

        {/* Portal into PiP Window */}
        {pipRoot && createPortal(renderNoteContent(true), pipRoot)}
      </>
    );
  }

  // Standard in-tab floating rendering
  return (
    <div
      className="pointer-events-auto absolute z-40 transition-shadow"
      style={{
        left: `${note.position?.x || 100}px`,
        top: `${note.position?.y || 100}px`,
        width: `${note.size?.width || 340}px`,
        height: note.isCollapsed ? 'auto' : `${note.size?.height || 480}px`,
      }}
    >
      {renderNoteContent(false)}
    </div>
  );
};
