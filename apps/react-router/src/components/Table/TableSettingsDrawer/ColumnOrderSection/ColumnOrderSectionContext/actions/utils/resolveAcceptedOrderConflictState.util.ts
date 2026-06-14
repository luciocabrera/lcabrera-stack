import type {
  ColumnOrderState,
  ColumnPinningState,
} from '@/components/Table/Table.types';
import type { OrderConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import {
  resolvePinOrderConflict,
  restoreStaticColumnOrder,
  restoreStaticPinnedColumns,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

type ResolveAcceptedOrderConflictStateArgs = {
  readonly currentOrder: ColumnOrderState;
  readonly defaultPinning: ColumnPinningState;
  readonly pendingOrder: ColumnOrderState;
  readonly pendingPinning: ColumnPinningState;
  readonly resolution: OrderConflictResolution;
  readonly staticKeys: Set<string>;
};

type ResolveAcceptedOrderConflictStateResult = {
  readonly columnOrder: ColumnOrderState;
  readonly columnPinning: ColumnPinningState;
};

export const resolveAcceptedOrderConflictState = ({
  currentOrder,
  defaultPinning,
  pendingOrder,
  pendingPinning,
  resolution,
  staticKeys,
}: ResolveAcceptedOrderConflictStateArgs): ResolveAcceptedOrderConflictStateResult => {
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
