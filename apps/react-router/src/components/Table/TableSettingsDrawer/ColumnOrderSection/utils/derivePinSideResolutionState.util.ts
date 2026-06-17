import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@/components/Table/Table.types';
import type { PinSide } from '@/types/ui.types';

import { syncColumnOrderWithPinning } from '@/components/Table/utils';

import { applyPin } from './applyPin.util';
import { getIsContiguousPin } from './getIsContiguousPin.util';
import { resolveClosestEdgeSide } from './resolveClosestEdgeSide.util';

type DerivePinSideResolutionStateArgs<TData> = {
  readonly allOrderedColumns: readonly TableColumn<TData>[];
  readonly columnKey: DataKey<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly currentOrder: ColumnOrderState<TData>;
  readonly pinSide: PinSide;
  readonly staticKeys?: Set<string>;
};

type DerivePinSideResolutionStateConflict = {
  readonly kind: 'conflict';
  readonly side: 'left' | 'right';
};

type DerivePinSideResolutionStateResolved<TData> = {
  readonly kind: 'resolved';
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly side: 'left' | 'right';
};

type DerivePinSideResolutionStateResult<TData> =
  | DerivePinSideResolutionStateConflict
  | DerivePinSideResolutionStateResolved<TData>;

/**
 * Pure pin-side resolution: computes side from pin preference, checks contiguity,
 * and returns either a conflict decision or resolved pinning/order state.
 *
 * Used by both drawer (ColumnOrderSection) and header pin-side modals to ensure
 * consistent resolution logic across UI entry points.
 */
export const derivePinSideResolutionState = <TData>({
  allOrderedColumns,
  columnKey,
  columnPinning,
  columns,
  currentOrder,
  pinSide,
  staticKeys,
}: DerivePinSideResolutionStateArgs<TData>): DerivePinSideResolutionStateResult<TData> => {
  const side = resolveClosestEdgeSide({
    allOrderedColumns,
    columnKey,
    pinSide,
  });

  const isContiguousPin = getIsContiguousPin<TData>({
    allOrderedColumns,
    columnKey,
    columnPinning,
    side,
  });

  if (!isContiguousPin) {
    return {
      kind: 'conflict',
      side,
    };
  }

  const newPinning = applyPin<TData>({
    columnKey,
    columnPinning,
    side,
    staticKeys,
  });

  const newColumnOrder = syncColumnOrderWithPinning<TData>({
    columnKey,
    columnPinning: side,
    columns,
    currentOrder,
    newPinning,
  });

  return {
    kind: 'resolved',
    columnOrder: newColumnOrder,
    columnPinning: newPinning,
    side,
  };
};
