import type {
  ColumnOrderState,
  DataKey,
  TableColumn,
} from '@/components/Table/Table.types';

import { syncColumnOrderWithPinning } from '@/components/Table/utils';
import { getNewPinningBasedOnColumnKey } from '@/components/Table/utils/getNewPinningBasedOnColumnKey.util';

type ResolveColumnPinningUpdateArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly currentOrder: ColumnOrderState<TData>;
  readonly currentPinning: {
    readonly left: DataKey<TData>[];
    readonly right: DataKey<TData>[];
  };
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
