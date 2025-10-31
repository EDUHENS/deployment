const DAY_IN_MS = 1000 * 60 * 60 * 24;

export type DueStatusTone = 'success' | 'warning' | 'muted';

export interface DueStatus {
  label: string;
  tone: DueStatusTone;
}

export function getDueStatus(dueDate: string | Date | null | undefined): DueStatus {
  if (!dueDate) {
    return { label: 'No due date', tone: 'muted' };
  }

  const dueMs = new Date(dueDate).getTime();
  if (Number.isNaN(dueMs)) {
    return { label: 'Invalid due date', tone: 'muted' };
  }

  const diff = Math.floor((dueMs - Date.now()) / DAY_IN_MS);

  if (diff > 2) {
    return { label: 'Due in more than 2 days', tone: 'success' };
  }

  if (diff >= 0) {
    if (diff === 2) return { label: 'Due in 2 days', tone: 'warning' };
    if (diff === 1) return { label: 'Due tomorrow', tone: 'warning' };
    return { label: 'Due today', tone: 'warning' };
  }

  return { label: 'Overdue', tone: 'muted' };
}
