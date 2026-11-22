import { Table } from '@lcabrera/ui/components/Table';

import type { CostTableProps } from './EvalsCost.types';

import { EVALS_TABLE_FEATURES } from '../constants/evalsDashboard.constants';
import { COST_TABLE_COLUMNS } from './EvalsCost.constants';

export const CostTable = ({ density, rows, title }: CostTableProps) => (
  <Table
    columns={COST_TABLE_COLUMNS}
    density={density}
    features={EVALS_TABLE_FEATURES}
    layout='static'
    response={rows}
    title={title}
  />
);
