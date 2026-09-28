import type {
  ColumnPinningState,
  TableColumnsState,
} from '#ui/components/Table/Table.types';

import { restoreStaticPinnedColumns } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

export const getClearedColumnPinning = (
  appliedState:
    | Pick<TableColumnsState, 'columnPinning' | 'staticKeys'>
    | undefined,
) => {
  const emptyPinning: ColumnPinningState = { left: [], right: [] };

  return restoreStaticPinnedColumns({
    defaultPinning: appliedState?.columnPinning ?? emptyPinning,
    finalPinning: emptyPinning,
    staticKeys: appliedState?.staticKeys ?? new Set<string>(),
  });
};
