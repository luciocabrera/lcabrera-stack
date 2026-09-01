import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import type { ColumnSizingArgs } from './useSetColumnSizingWithoutSync.hook';

import { usePersistColumnSizingAction } from './hooks/usePersistColumnSizingAction.hook';
import { writeColumnSizing } from './utils';

export const useSetColumnSizing = <TData>() => {
  const { columnsStore } = useTableConfigContextValue<TData>();
  const persistColumnSizing = usePersistColumnSizingAction<TData>();

  return ({ columnKey, width }: ColumnSizingArgs<TData>) => {
    writeColumnSizing<TData>({ columnKey, columnsStore, width });
    persistColumnSizing();
  };
};
