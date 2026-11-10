import type { BreadcrumbHandle } from '@lcabrera/ui';
import type { TableColumn } from '@lcabrera/ui/components/Table';

import { NavLink } from '@lcabrera/ui/components/NavLink';

import type { CostFigureColumn, CostRow } from './EvalsCost.types';

import { EVALS_COST_LABELS } from '../constants/evalsDashboard.constants';

export const EVALS_COST_HANDLE = {
  breadcrumb: () => [
    { label: 'Evals', to: '/evals' },
    { label: 'cost and latency' },
  ],
} satisfies BreadcrumbHandle;

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

const COST_FIGURE_COLUMNS: readonly CostFigureColumn[] = [
  { dataType: 'number', key: 'trials', label: 'Trials' },
  { dataType: 'number', key: 'tokensIn', label: 'Tokens in' },
  { dataType: 'number', key: 'tokensOut', label: 'Tokens out' },
  { dataType: 'number', key: 'tokensCache', label: 'Cache tokens' },
  { dataType: 'currency', key: 'reported', label: EVALS_COST_LABELS.reported },
  { dataType: 'currency', key: 'computed', label: EVALS_COST_LABELS.computed },
  { dataType: 'number', key: 'p50', label: 'p50 duration' },
  { dataType: 'number', key: 'p95', label: 'p95 duration' },
];

export const COST_TABLE_COLUMNS: readonly TableColumn<CostRow>[] = [
  {
    key: 'name',
    label: 'Name',
    render: ({ href, name }: CostRow) =>
      href === undefined ? (
        name
      ) : (
        <NavLink to={href} variant='inline'>
          {name}
        </NavLink>
      ),
  },
  ...COST_FIGURE_COLUMNS.map(
    ({ dataType, key, label }): TableColumn<CostRow> => ({
      align: 'end',
      dataType,
      key,
      label,
      render: (row) => row[key],
    }),
  ),
];
