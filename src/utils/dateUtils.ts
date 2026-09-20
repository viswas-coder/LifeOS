import { Weekday } from '../types';

/**
 * Timezone-safe local date utilities for LifeOS tasks and calendar items.
 * Uses the client machine's local calendar day rather than UTC ISO day to avoid
 * offset bugs when converting near midnight or in non-UTC timezones.
 */

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekdayFromDateString(dateStr: string): Weekday {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return 'monday';
  }
  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  const weekdays: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return weekdays[dateObj.getDay()] || 'monday';
}

export function formatDateWithWeekday(dateStr: string): {
  weekdayName: string;
  formattedDate: string;
} {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return { weekdayName: '', formattedDate: dateStr };
  }
  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  const weekdaysUpper = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return {
    weekdayName: weekdaysUpper[dateObj.getDay()],
    formattedDate: `${monthNames[month - 1]} ${day}`,
  };
}

export function isTaskOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'completed') return false;
  const today = getLocalDateString();
  return dueDate < today;
}

export function isTaskDueToday(dueDate?: string): boolean {
  if (!dueDate) return false;
  const today = getLocalDateString();
  return dueDate === today;
}

export function isTaskUpcoming(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'completed') return false;
  const today = getLocalDateString();
  return dueDate > today;
}

export function formatTaskDueDate(dueDate?: string, dueTime?: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isUpcoming: boolean;
} {
  if (!dueDate) {
    return { label: 'No due date', isOverdue: false, isToday: false, isUpcoming: false };
  }
  const today = getLocalDateString();
  const isOverdue = dueDate < today;
  const isToday = dueDate === today;
  const isUpcoming = dueDate > today;

  let label = dueDate;
  if (isToday) {
    label = dueTime ? `Today at ${dueTime}` : 'Due Today';
  } else if (isOverdue) {
    label = dueTime ? `Overdue (${dueDate} ${dueTime})` : `Overdue (${dueDate})`;
  } else {
    label = dueTime ? `${dueDate} at ${dueTime}` : dueDate;
  }

  return { label, isOverdue, isToday, isUpcoming };
}

export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 24 * 60; // place untimed items at end of day
  const clean = timeStr.trim().toUpperCase();

  // Check 12-hour AM/PM format (e.g. "09:30 AM", "1:00 PM")
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridian = match12[3];

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Check simple 24-hour format (e.g. "15:30")
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return 24 * 60;
}

export function formatTimeString(timeStr?: string): string {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  if (clean.toUpperCase().includes('AM') || clean.toUpperCase().includes('PM')) {
    return clean;
  }
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  }
  return clean;
}

