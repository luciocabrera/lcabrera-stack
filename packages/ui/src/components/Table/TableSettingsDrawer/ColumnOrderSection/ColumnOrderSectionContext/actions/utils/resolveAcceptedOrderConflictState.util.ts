import type {
  ColumnOrderState,
  ColumnPinningState,
} from '@lcabrera/ui/components/Table/Table.types';
import type { OrderConflictResolution } from '@lcabrera/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import {
  resolvePinOrderConflict,
  restoreStaticColumnOrder,
  restoreStaticPinnedColumns,
} from '@lcabrera/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

type ResolveAcceptedOrderConflictStateArgs = {
  readonly currentOrder: ColumnOrderState;
  readonly defaultPinning: ColumnPinningState;
  readonly pendingOrder: ColumnOrderState;
  readonly pendingPinning: ColumnPinningState;
  readonly resolution: OrderConflictResolution;
  readonly staticKeys: Set<string>;
};

export const resolveAcceptedOrderConflictState = ({
  currentOrder,
  defaultPinning,
  pendingOrder,
  pendingPinning,
  resolution,
  staticKeys,
}: ResolveAcceptedOrderConflictStateArgs) => {
  const conflictResolution = resolvePinOrderConflict({
    columnPinning: pendingPinning,
    newOrder: pendingOrder,
    resolution,
  });

  const columnOrder = restoreStaticColumnOrder({
    currentOrder,
    newOrder: conflictResolution.columnOrder,
    staticKeys,
  });

  const columnPinning = restoreStaticPinnedColumns({
    defaultPinning,
    finalPinning: conflictResolution.columnPinning,
    staticKeys,
  });

  return {
    columnOrder,
    columnPinning,
  };
};
