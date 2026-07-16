import type {
  ColumnOrderState,
  ColumnPinningState,
} from '@repo/ui/components/Table/Table.types';
import type { OrderConflictResolution } from '@repo/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import {
  resolvePinOrderConflict,
  restoreStaticColumnOrder,
  restoreStaticPinnedColumns,
} from '@repo/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

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
