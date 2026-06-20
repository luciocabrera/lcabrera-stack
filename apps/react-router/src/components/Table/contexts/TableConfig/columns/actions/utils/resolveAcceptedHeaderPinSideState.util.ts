import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@/components/Table/Table.types';
import type { PinConflictState, PinSide } from '@/types/ui.types';

import {
  buildAllOrderedColumns,
  derivePinSideResolutionState,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

type ResolveAcceptedHeaderPinSideStateArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly pinSide: PinSide;
  readonly staticKeys?: Set<string>;
};

type ResolveAcceptedHeaderPinSideStateResult<TData> =
  | {
      readonly columnOrder: ColumnOrderState<TData>;
      readonly columnPinning: ColumnPinningState<TData>;
      readonly kind: 'resolved';
    }
  | {
      readonly conflict: PinConflictState;
      readonly kind: 'conflict';
    };

export const resolveAcceptedHeaderPinSideState = <TData>({
  columnKey,
  columnOrder,
  columnPinning,
  columns,
  pinSide,
  staticKeys,
}: ResolveAcceptedHeaderPinSideStateArgs<TData>): ResolveAcceptedHeaderPinSideStateResult<TData> => {
  const allOrderedColumns = buildAllOrderedColumns({
    columns,
    columnsOrder: columnOrder,
  });

  const resolution = derivePinSideResolutionState<TData>({
    allOrderedColumns,
    columnKey,
    columnPinning,
    columns,
    currentOrder: columnOrder,
    pinSide,
    staticKeys,
  });

  if (resolution.kind === 'conflict') {
    return {
      conflict: { isOpen: true, side: resolution.side },
      kind: 'conflict',
    };
  }

  return {
    columnOrder: resolution.columnOrder,
    columnPinning: resolution.columnPinning,
    kind: 'resolved',
  };
};
