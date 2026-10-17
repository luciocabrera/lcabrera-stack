import type { FiguresColumn } from '../FiguresTable';

import { EVALS_COST_LABELS } from '../constants/evalsDashboard.constants';

export const COST_COLUMNS: readonly FiguresColumn[] = [
  { key: 'name', label: 'Name' },
  { isNumeric: true, key: 'trials', label: 'Trials' },
  { isNumeric: true, key: 'tokensIn', label: 'Tokens in' },
  { isNumeric: true, key: 'tokensOut', label: 'Tokens out' },
  { isNumeric: true, key: 'tokensCache', label: 'Cache tokens' },
  { isNumeric: true, key: 'reported', label: EVALS_COST_LABELS.reported },
  { isNumeric: true, key: 'computed', label: EVALS_COST_LABELS.computed },
  { isNumeric: true, key: 'p50', label: 'p50 duration' },
  { isNumeric: true, key: 'p95', label: 'p95 duration' },
];
