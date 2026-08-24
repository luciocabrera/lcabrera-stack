import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import type { ColumnSizingArgs } from './useSetColumnSizingWithoutSync.hook';

import { usePersistColumnSizingAction } from './hooks/usePersistColumnSizingAction.hook';
import { writeColumnSizing } from './utils';

/**
 * Persistence lives here rather than at the call site, matching how `useSetColumnPinning`
 * and `useSetColumnSorting` own theirs — a caller should never have to remember to pair a
 * width change with a separate sync.
 */
export const useSetColumnSizing = <TData>() => {
  const { columnsStore } = useTableConfigContextValue<TData>();
  const persistColumnSizing = usePersistColumnSizingAction<TData>();

  return ({ columnKey, width }: ColumnSizingArgs<TData>) => {
    writeColumnSizing<TData>({ columnKey, columnsStore, width });
    persistColumnSizing();
  };
};
