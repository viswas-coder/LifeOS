import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { CalendarItem } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

export const CalendarView: React.FC = () => {
  const { calendar, addCalendarItem, deleteCalendarItem, tasks, toggleTaskComplete } = useLifeOS();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(getLocalDateString());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newDuration, setNewDuration] = useState(45);
  const [newType, setNewType] = useState<CalendarItem['type']>('task');

  // Days in month calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addCalendarItem({
      title: newTitle.trim(),
      date: selectedDateStr,
      time: newTime,
      durationMinutes: newDuration,
      type: newType,
      color: newType === 'task' ? '#6366F1' : newType === 'learning_session' ? '#10B981' : '#F59E0B',
    });
    setIsAddModalOpen(false);
    setNewTitle('');
  };

  const selectedDayItems = calendar.filter(c => c.date === selectedDateStr);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Calendar</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Time-blocked roadmap, learning sessions, project milestones, and upcoming deadlines.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3 py-1.5 text-xs font-medium transition-all shadow-ambient-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Monthly Grid */}
        <div className="lg:col-span-2 surface-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1 rounded-md text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 rounded-md text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase tracking-wider text-neutral-500 pb-2 border-b border-white/[0.04]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-20 rounded-lg bg-white/[0.01]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDateStr;
              const dayItems = calendar.filter(c => c.date === dateStr);

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 rounded-lg border p-1.5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-white/[0.2] bg-white/[0.06] shadow-ambient-sm'
                      : 'border-white/[0.04] bg-[#12141a] hover:border-white/[0.08]'
                  }`}
                >
                  <span
                    className={`text-xs font-mono font-medium ${
                      isSelected ? 'text-white' : 'text-neutral-400'
                    }`}
                  >
                    {dayNum}
                  </span>

                  <div className="space-y-0.5 overflow-hidden">
                    {dayItems.slice(0, 2).map(item => (
                      <div
                        key={item.id}
                        className="truncate rounded px-1.5 py-0.5 text-[9px] font-medium bg-white/[0.04] text-neutral-300 border border-white/[0.05]"
                      >
                        {item.title}
                      </div>
                    ))}
                    {dayItems.length > 2 && (
                      <span className="text-[9px] text-neutral-500 pl-1 font-mono">
                        +{dayItems.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Day Agenda */}
        <div className="surface-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <div>
              <h3 className="text-xs font-semibold text-neutral-200">Agenda</h3>
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{selectedDateStr} · {selectedDayItems.length} items</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-md border border-white/[0.08] bg-white/[0.03] p-1 text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {selectedDayItems.map(item => {
              const linkedTask = item.referenceId ? tasks.find(t => t.id === item.referenceId) : undefined;
              const isTaskCompleted = linkedTask?.status === 'completed';

              return (
                <div
                  key={item.id}
                  className={`flex items-start justify-between rounded-lg border border-white/[0.04] p-3 text-xs transition-all ${
                    isTaskCompleted ? 'bg-white/[0.01] opacity-50' : 'bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                    {linkedTask && (
                      <button
                        onClick={() => toggleTaskComplete(linkedTask.id)}
                        className="mt-0.5 text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
                        title={isTaskCompleted ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {isTaskCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className={`font-medium truncate block ${isTaskCompleted ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {item.time || 'All day'} ({item.durationMinutes}m)
                        </span>
                        <span className="capitalize text-neutral-400">{item.type}</span>
                        {linkedTask && (
                          <span className="text-neutral-500">· Linked Task</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteCalendarItem(item.id)}
                    className="text-neutral-500 hover:text-rose-400 p-0.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {selectedDayItems.length === 0 && (
              <div className="py-8 text-center text-xs text-neutral-500">
                No items on this date.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Event */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#0e1015] p-5 shadow-ambient-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-semibold text-neutral-100">Schedule Event or Block</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-500 hover:text-neutral-300 text-xs">✕</button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Deep Practice: Agent Tool Dispatcher"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
                >
                  <option value="task">Task Deadline</option>
                  <option value="session">Skill Learning Session</option>
                  <option value="meeting">Discussion / Meeting</option>
                  <option value="milestone">Project Milestone</option>
                </select>
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
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
