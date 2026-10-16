import type { FiguresColumn } from '../FiguresTable';

export const FLIP_COLUMNS: readonly FiguresColumn[] = [
  { key: 'task', label: 'Task' },
  { key: 'subject', label: 'Subject' },
  { isNumeric: true, key: 'a', label: 'A' },
  { isNumeric: true, key: 'b', label: 'B' },
  { key: 'change', label: 'Change' },
];

export const TOTAL_COLUMNS: readonly FiguresColumn[] = [
  { key: 'metric', label: 'Total' },
  { isNumeric: true, key: 'a', label: 'A' },
  { isNumeric: true, key: 'b', label: 'B' },
  { isNumeric: true, key: 'change', label: 'Change' },
];
