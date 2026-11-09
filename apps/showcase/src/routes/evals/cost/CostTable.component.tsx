import { Table } from '@lcabrera/ui/components/Table';

import type { CostTableProps } from './EvalsCost.types';

import { COST_TABLE_COLUMNS } from './costTableColumns.util';

export const CostTable = ({ caption, density, rows }: CostTableProps) => (
  <Table
    caption={caption}
    columns={COST_TABLE_COLUMNS}
    density={density}
    layout='static'
    response={rows}
  />
);
