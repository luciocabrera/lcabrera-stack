import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@/components/Table/Table.types';
import type { PinConflictResolution } from '@/types/ui.types';

import {
  buildAllOrderedColumns,
  resolvePinConflictState,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

type ResolveAcceptedHeaderPinConflictStateArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly resolution: PinConflictResolution;
  readonly side: 'left' | 'right';
  readonly staticKeys?: Set<string>;
};

export const resolveAcceptedHeaderPinConflictState = <TData>({
  columnKey,
  columnOrder,
  columnPinning,
  columns,
  resolution,
  side,
  staticKeys,
}: ResolveAcceptedHeaderPinConflictStateArgs<TData>) => {
  const allOrderedColumns = buildAllOrderedColumns({
    columns,
    columnsOrder: columnOrder,
  });

  return resolvePinConflictState<TData>({
    allOrderedColumns,
    columnKey,
    columns,
    currentOrder: columnOrder,
    currentPinning: columnPinning,
    resolution,
    side,
    staticKeys,
  });
};
