import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import { NavLink } from '@lcabrera/ui/components/NavLink';

import type { CostRow } from './EvalsCost.types';

import { EVALS_COST_LABELS } from '../constants/evalsDashboard.constants';

type FigureColumnArgs = {
  readonly dataType: 'currency' | 'number';
  readonly key: FigureKey;
  readonly label: string;
};

type FigureKey = Exclude<keyof CostRow, 'href' | 'name'>;

const figureColumn = ({ dataType, key, label }: FigureColumnArgs) =>
  ({
    align: 'end',
    dataType,
    key,
    label,
    render: (row) => row[key],
  }) satisfies TableColumn<CostRow>;

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
  } satisfies TableColumn<CostRow>,
  figureColumn({ dataType: 'number', key: 'trials', label: 'Trials' }),
  figureColumn({ dataType: 'number', key: 'tokensIn', label: 'Tokens in' }),
  figureColumn({ dataType: 'number', key: 'tokensOut', label: 'Tokens out' }),
  figureColumn({
    dataType: 'number',
    key: 'tokensCache',
    label: 'Cache tokens',
  }),
  figureColumn({
    dataType: 'currency',
    key: 'reported',
    label: EVALS_COST_LABELS.reported,
  }),
  figureColumn({
    dataType: 'currency',
    key: 'computed',
    label: EVALS_COST_LABELS.computed,
  }),
  figureColumn({ dataType: 'number', key: 'p50', label: 'p50 duration' }),
  figureColumn({ dataType: 'number', key: 'p95', label: 'p95 duration' }),
];
