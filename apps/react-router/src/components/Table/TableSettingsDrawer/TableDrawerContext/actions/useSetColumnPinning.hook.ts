import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@/components/Table/Table.types';

import { syncColumnOrderWithPinning } from '@/components/Table/utils';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

export const useSetColumnPinning = <TData>() => {
  const { columnsStore } = useTableDrawerContextValue<TData>();
  const { columnsStore: tableColumnsStore } =
    useTableConfigContextValue<TData>();

  return (columnPinning: ColumnPinningState<TData>) => {
    const columnsState = columnsStore.get();
    const currentPinning = columnsState?.columnPinning ?? {
      left: [],
      right: [],
    };
    const tableState = tableColumnsStore.get();
    const columns = tableState?.columns ?? [];
    const currentOrder =
      columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);

    const changedLeftColumn = columnPinning.left.find(
      (key) =>
        !currentPinning.left.includes(key) &&
        !currentPinning.right.includes(key),
    );
    const changedRightColumn = columnPinning.right.find(
      (key) =>
        !currentPinning.left.includes(key) &&
        !currentPinning.right.includes(key),
    );
    const changedColumnKey = changedLeftColumn ?? changedRightColumn;
    const changedSide = changedLeftColumn
      ? 'left'
      : changedRightColumn
        ? 'right'
        : undefined;

    const newColumnOrder = syncColumnOrderWithPinning<TData>({
      columnKey: changedColumnKey ?? ('' as DataKey<TData>),
      columnPinning: changedSide,
      columns,
      currentOrder,
      newPinning: columnPinning,
    });

    columnsStore.set({
      columnOrder: newColumnOrder,
      columnPinning,
    });
  };
};
