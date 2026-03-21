import type {
  ColumnPinningState,
  DataKey,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import { getEffectiveColumns } from '@/components/Table/utils';

type SetColumnPinningArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly side: 'left' | 'right' | undefined;
};

export const useSetColumnPinning = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, side }: SetColumnPinningArgs<TData>) => {
    const columnsState = columnsStore.get();
    const currentPinning = columnsState?.columnPinning ?? {
      left: [],
      right: [],
    };
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';

    const left = currentPinning.left.filter((k) => k !== columnKey);
    const right = currentPinning.right.filter((k) => k !== columnKey);

    let newPinning: ColumnPinningState<TData>;
    if (side === 'left') {
      newPinning = { left: [...left, columnKey], right };
    } else if (side === 'right') {
      newPinning = { left, right: [...right, columnKey] };
    } else {
      newPinning = { left, right };
    }

    const effectiveColumns = getEffectiveColumns({
      columnOrder: columnsState?.columnOrder,
      columnPinning: newPinning,
      columns: columnsState?.columns ?? [],
      columnVisibility: columnsState?.columnVisibility,
    });

    persistTableState({
      persistenceKey,
      slice: 'columnPinning',
      valueSlice: newPinning,
    });

    columnsStore.set({ columnPinning: newPinning, effectiveColumns });
  };
};
