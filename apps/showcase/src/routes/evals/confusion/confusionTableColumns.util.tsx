import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import type { ConfusionTableRow } from './EvalsConfusion.types';

import { ConfusionCell } from './ConfusionCell.component';
import { confusionColumnKey } from './confusionColumnKey.util';
import { CORNER } from './EvalsConfusion.constants';

export const confusionTableColumns = (
  loaded: readonly string[],
): readonly TableColumn<ConfusionTableRow>[] => [
  { key: 'expected', label: CORNER },
  ...loaded.map((column) => {
    const key = confusionColumnKey(column);

    return {
      align: 'end',
      dataType: 'number',
      key,
      label: column,
      render: (row) => <ConfusionCell cell={row[key]} />,
    } satisfies TableColumn<ConfusionTableRow>;
  }),
  { align: 'end', dataType: 'number', key: 'trials', label: 'Trials' },
];
