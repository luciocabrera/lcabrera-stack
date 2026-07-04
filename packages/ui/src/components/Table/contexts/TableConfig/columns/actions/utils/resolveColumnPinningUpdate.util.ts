import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

import { syncColumnOrderWithPinning } from '@repo/ui/components/Table/utils';
import { getNewPinningBasedOnColumnKey } from '@repo/ui/components/Table/utils/getNewPinningBasedOnColumnKey.util';

type ResolveColumnPinningUpdateArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly currentOrder: ColumnOrderState<TData>;
  readonly currentPinning: ColumnPinningState<TData>;
  readonly side?: 'left' | 'right';
  readonly staticKeys?: Set<string>;
};

export const resolveColumnPinningUpdate = <TData>({
  columnKey,
  columns,
  currentOrder,
  currentPinning,
  side,
  staticKeys,
}: ResolveColumnPinningUpdateArgs<TData>) => {
  const newPinning = getNewPinningBasedOnColumnKey<TData>({
    columnKey,
    columnPinning: side,
    existingPinning: currentPinning,
    staticKeys,
  });

  return {
    newColumnOrder: syncColumnOrderWithPinning<TData>({
      columnKey,
      columnPinning: side,
      columns,
      currentOrder,
      newPinning,
      previousPinning: currentPinning,
    }),
    newPinning,
  };
};
