import { EVALS_COST_LABELS } from '../constants/evalsDashboard.constants';

export const COST_CHARTS = [
  {
    caption: `Cost per run, ${EVALS_COST_LABELS.reported.toLowerCase()}`,
    metric: 'reported',
  },
  {
    caption: `Cost per run, ${EVALS_COST_LABELS.computed.toLowerCase()}`,
    metric: 'computed',
  },
  { caption: 'p95 duration per run', metric: 'p95' },
] as const;

export const COST_SPARKLINE = { height: 48, width: 240 } as const;
