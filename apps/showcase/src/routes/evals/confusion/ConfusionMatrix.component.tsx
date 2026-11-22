import { Table } from '@lcabrera/ui/components/Table';

import type { ConfusionMatrixProps } from './EvalsConfusion.types';

import { EVALS_TITLE_BAR_FEATURES } from '../constants/evalsDashboard.constants';
import { confusionTableColumns } from './confusionTableColumns.util';
import { confusionTableRows } from './confusionTableRows.util';

export const ConfusionMatrix = ({ matrix, scope }: ConfusionMatrixProps) => (
  <Table
    columns={confusionTableColumns(matrix.columns)}
    density='compact'
    features={EVALS_TITLE_BAR_FEATURES}
    layout='static'
    response={confusionTableRows(matrix)}
    title={`Skills loaded per expectation over ${scope}`}
  />
);
