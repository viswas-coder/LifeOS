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
