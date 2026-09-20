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
  BookOpen,
  MapPin,
  User,
  X,
  RotateCcw,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { CalendarItem, Task } from '../types';
import {
  getLocalDateString,
  getWeekdayFromDateString,
  formatDateWithWeekday,
  parseTimeToMinutes,
  formatTimeString,
} from '../utils/dateUtils';
import {
  getTimetableEntriesForWeekday,
  EnrichedClassEntry,
} from '../data/timetableData';

type ScheduleItem =
  | {
      itemType: 'class';
      id: string;
      timeSortMinutes: number;
      timeLabel: string;
      entry: EnrichedClassEntry;
    }
  | {
      itemType: 'task';
      id: string;
      timeSortMinutes: number;
      timeLabel: string;
      task: Task;
    }
  | {
      itemType: 'event';
      id: string;
      timeSortMinutes: number;
      timeLabel: string;
      event: CalendarItem;
    };

export const CalendarView: React.FC = () => {
  const { calendar, addCalendarItem, deleteCalendarItem, tasks, toggleTaskComplete } = useLifeOS();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(getLocalDateString());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<EnrichedClassEntry | null>(null);
  const [agendaFilter, setAgendaFilter] = useState<'all' | 'class' | 'task' | 'event'>('all');

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
  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getLocalDateString(today));
  };

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

  // Selected Day Timetable Classes (based on weekday)
  const selectedWeekday = getWeekdayFromDateString(selectedDateStr);
  const dayClasses = getTimetableEntriesForWeekday(selectedWeekday);

  // Selected Day Tasks (from single source of truth `tasks`)
  const dayTasks = tasks.filter(t => t.dueDate === selectedDateStr);

  // Selected Day Calendar Events (custom events/blocks, excluding task duplicates)
  const dayCalendarEvents = calendar.filter(
    c => c.date === selectedDateStr && (!c.referenceId || !tasks.some(t => t.id === c.referenceId))
  );

  // Unified Schedule Items for Selected Date
  const scheduleItems: ScheduleItem[] = [
    ...dayClasses.map(c => ({
      itemType: 'class' as const,
      id: `class-${c.id}`,
      timeSortMinutes: parseTimeToMinutes(c.startTime),
      timeLabel: `${c.startTime} - ${c.endTime}`,
      entry: c,
    })),
    ...dayTasks.map(t => ({
      itemType: 'task' as const,
      id: `task-${t.id}`,
      timeSortMinutes: parseTimeToMinutes(t.dueTime),
      timeLabel: t.dueTime ? formatTimeString(t.dueTime) : 'Due Today',
      task: t,
    })),
    ...dayCalendarEvents.map(e => ({
      itemType: 'event' as const,
      id: `event-${e.id}`,
      timeSortMinutes: parseTimeToMinutes(e.time),
      timeLabel: e.time ? formatTimeString(e.time) : 'All day',
      event: e,
    })),
  ].sort((a, b) => a.timeSortMinutes - b.timeSortMinutes);

  const filteredItems =
    agendaFilter === 'all'
      ? scheduleItems
      : scheduleItems.filter(item => item.itemType === agendaFilter);

  const { weekdayName, formattedDate } = formatDateWithWeekday(selectedDateStr);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Calendar</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Unified daily schedule: recurring college timetable, tasks, learning sessions, and events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={jumpToToday}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-neutral-200 px-3 py-1.5 text-xs font-medium transition-all"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Today</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-3 py-1.5 text-xs font-medium transition-all shadow-ambient-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Grid */}
        <div className="lg:col-span-2 surface-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-md text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-md text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-colors"
                title="Next month"
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
              const isToday = dateStr === getLocalDateString();
              const dayWk = getWeekdayFromDateString(dateStr);
              const cellClasses = getTimetableEntriesForWeekday(dayWk);
              const cellTasks = tasks.filter(t => t.dueDate === dateStr);
              const cellEvents = calendar.filter(
                c => c.date === dateStr && (!c.referenceId || !tasks.some(t => t.id === c.referenceId))
              );

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 rounded-lg border p-1.5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-white/[0.25] bg-white/[0.07] shadow-ambient-sm ring-1 ring-white/10'
                      : isToday
                      ? 'border-sky-500/40 bg-sky-500/[0.03] hover:border-sky-500/60'
                      : 'border-white/[0.04] bg-[#12141a] hover:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-medium ${
                        isSelected ? 'text-white' : isToday ? 'text-sky-400 font-semibold' : 'text-neutral-400'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="text-[7.5px] font-mono text-sky-400 uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {cellClasses.length > 0 && (
                      <div className="truncate rounded px-1 py-0.2 text-[8px] font-medium bg-sky-500/15 text-sky-300 border border-sky-500/20">
                        📚 {cellClasses.length} classes
                      </div>
                    )}
                    {cellTasks.slice(0, cellClasses.length > 0 ? 1 : 2).map(task => (
                      <div
                        key={task.id}
                        className={`truncate rounded px-1 py-0.2 text-[8px] font-medium border ${
                          task.status === 'completed'
                            ? 'bg-white/[0.02] text-neutral-500 border-white/[0.03] line-through'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}
                      >
                        ☐ {task.title}
                      </div>
                    ))}
                    {cellEvents.slice(0, 1).map(item => (
                      <div
                        key={item.id}
                        className="truncate rounded px-1 py-0.2 text-[8px] font-medium bg-white/[0.04] text-neutral-300 border border-white/[0.05]"
                      >
                        📌 {item.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Day Agenda */}
        <div className="surface-card rounded-xl p-5 space-y-4 flex flex-col">
          {/* Day Header */}
          <div className="border-b border-white/[0.06] pb-3 space-y-1.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  {weekdayName}
                </span>
                <h3 className="text-sm font-semibold text-neutral-100">
                  {formattedDate}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="rounded-md border border-white/[0.08] bg-white/[0.03] p-1.5 text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Add calendar event"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10.5px] text-neutral-400 pt-0.5 font-mono">
              <span className="flex items-center gap-1">
                <span className="text-sky-400">📚</span> {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="text-amber-400">☐</span> {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="text-violet-400">📌</span> {dayCalendarEvents.length} {dayCalendarEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-1">
            <button
              onClick={() => setAgendaFilter('all')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                agendaFilter === 'all'
                  ? 'bg-white/[0.1] text-white font-medium'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]'
              }`}
            >
              All ({scheduleItems.length})
            </button>
            <button
              onClick={() => setAgendaFilter('class')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                agendaFilter === 'class'
                  ? 'bg-sky-500/20 text-sky-200 font-medium border border-sky-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]'
              }`}
            >
              📚 Classes ({dayClasses.length})
            </button>
            <button
              onClick={() => setAgendaFilter('task')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                agendaFilter === 'task'
                  ? 'bg-amber-500/20 text-amber-200 font-medium border border-amber-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]'
              }`}
            >
              ☐ Tasks ({dayTasks.length})
            </button>
            <button
              onClick={() => setAgendaFilter('event')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                agendaFilter === 'event'
                  ? 'bg-violet-500/20 text-violet-200 font-medium border border-violet-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]'
              }`}
            >
              📌 Events ({dayCalendarEvents.length})
            </button>
          </div>

          {/* List of Schedule Items */}
          <div className="space-y-2.5 overflow-y-auto max-h-[520px] pr-0.5">
            {/* If weekend / no classes banner */}
            {dayClasses.length === 0 && (agendaFilter === 'all' || agendaFilter === 'class') && (
              <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] p-3 text-center space-y-0.5">
                <div className="text-xs text-neutral-400 font-medium">📚 No classes scheduled</div>
                <p className="text-[10px] text-neutral-500">
                  {selectedWeekday === 'saturday' || selectedWeekday === 'sunday'
                    ? 'Weekend · No college classes in weekly timetable'
                    : 'No classes configured for this day'}
                </p>
              </div>
            )}

            {filteredItems.map(item => {
              if (item.itemType === 'class') {
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedClass(item.entry)}
                    className="group rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 text-xs transition-all hover:border-white/[0.12] hover:bg-white/[0.04] cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-sky-300/90 font-medium">
                        <Clock className="h-3 w-3 text-sky-400" />
                        {item.timeLabel}
                      </span>
                      <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/20">
                        📚 Class
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-neutral-100 group-hover:text-white">
                          {item.entry.subject.code}
                        </span>
                        <span className="text-xs text-neutral-400 truncate">
                          {item.entry.subject.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500 border-t border-white/[0.03] pt-1.5">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-neutral-400" />
                        {item.entry.subject.faculty}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-neutral-400" />
                        {item.entry.subject.building} · {item.entry.subject.room}
                      </span>
                    </div>
                  </div>
                );
              }

              if (item.itemType === 'task') {
                const isTaskCompleted = item.task.status === 'completed';
                return (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between rounded-lg border border-white/[0.05] p-3 text-xs transition-all ${
                      isTaskCompleted
                        ? 'bg-white/[0.01] opacity-50 border-white/[0.02]'
                        : 'bg-white/[0.02] hover:border-white/[0.1]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                      <button
                        onClick={() => toggleTaskComplete(item.task.id)}
                        className="mt-0.5 text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
                        title={isTaskCompleted ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {isTaskCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-medium truncate block ${
                              isTaskCompleted ? 'line-through text-neutral-500' : 'text-neutral-200'
                            }`}
                          >
                            {item.task.title}
                          </span>
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 shrink-0">
                            ☐ Task
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.timeLabel}
                          </span>
                          {item.task.priority === 'urgent' && (
                            <span className="text-rose-400 uppercase font-semibold">urgent</span>
                          )}
                          {item.task.status === 'in_progress' && (
                            <span className="text-amber-400">in progress</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.itemType === 'event') {
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 text-xs transition-all hover:border-white/[0.1]"
                  >
                    <div className="space-y-1 min-w-0 flex-1 pr-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-neutral-200 truncate block">
                          {item.event.title}
                        </span>
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 shrink-0">
                          📌 Event
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.timeLabel} ({item.event.durationMinutes || 45}m)
                        </span>
                        <span className="capitalize text-neutral-400">{item.event.type}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteCalendarItem(item.event.id)}
                      className="text-neutral-500 hover:text-rose-400 p-0.5 transition-colors shrink-0"
                      title="Delete event"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              }

              return null;
            })}

            {filteredItems.length === 0 && dayClasses.length > 0 && (
              <div className="py-8 text-center text-xs text-neutral-500">
                No items matching this filter.
              </div>
            )}

            {filteredItems.length === 0 && dayClasses.length === 0 && (
              <div className="py-6 text-center text-xs text-neutral-500">
                No classes, tasks, or events for this date.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Class Details Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#0e1015] p-5 shadow-ambient-lg space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.06] pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded px-2 py-0.5 text-xs font-bold text-sky-300 bg-sky-500/15 border border-sky-500/30">
                    {selectedClass.subject.code}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    College Timetable
                  </span>
                </div>
                <h3 className="text-base font-semibold text-neutral-100">
                  {selectedClass.subject.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="rounded-md p-1 text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                <Clock className="h-4 w-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-mono text-neutral-500">Time & Recurrence</div>
                  <div className="text-neutral-200 font-medium">
                    {selectedClass.startTime} – {selectedClass.endTime}
                  </div>
                  <div className="text-[11px] text-neutral-400 capitalize">
                    Recurring every {selectedClass.weekday}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                <User className="h-4 w-4 text-neutral-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-mono text-neutral-500">Faculty</div>
                  <div className="text-neutral-200 font-medium">
                    {selectedClass.subject.faculty}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                <MapPin className="h-4 w-4 text-neutral-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-mono text-neutral-500">Location</div>
                  <div className="text-neutral-200 font-medium">
                    {selectedClass.subject.building}, {selectedClass.subject.room}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Building: {selectedClass.subject.building} · Room: {selectedClass.subject.room}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setSelectedClass(null)}
                className="rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 px-4 py-1.5 text-xs font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                  placeholder="e.g. Project Review or Study Block"
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
                  <option value="learning_session">Skill Learning Session</option>
                  <option value="event">Discussion / Meeting</option>
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
