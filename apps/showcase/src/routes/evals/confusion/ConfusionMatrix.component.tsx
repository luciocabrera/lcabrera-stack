import { Table } from '@lcabrera/ui/components/Table';

import type { ConfusionMatrixProps } from './EvalsConfusion.types';

import { confusionTableColumns } from './confusionTableColumns.util';
import { confusionTableRows } from './confusionTableRows.util';

export const ConfusionMatrix = ({ matrix, scope }: ConfusionMatrixProps) => (
  <Table
    caption={`Skills loaded per expectation over ${scope}`}
    columns={confusionTableColumns(matrix.columns)}
    density='compact'
    layout='static'
    response={confusionTableRows(matrix)}
  />
);
