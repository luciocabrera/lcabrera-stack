import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import type { ColumnSizingArgs } from './useSetColumnSizingWithoutSync.hook';

import { usePersistColumnSizingAction } from './hooks/usePersistColumnSizingAction.hook';
import { writeColumnSizing } from './utils';

/**
 * Writes the new width and persists it. Persistence lives here rather than at the call
 * site. The one caller that opts out is `useColumnDragSession`, which writes a width per
 * animation frame — see `useSetColumnSizingWithoutSync`.
 */
export const useSetColumnSizing = <TData>() => {
  const { columnsStore } = useTableConfigContextValue<TData>();
  const persistColumnSizing = usePersistColumnSizingAction<TData>();

  return ({ columnKey, width }: ColumnSizingArgs<TData>) => {
    writeColumnSizing<TData>({ columnKey, columnsStore, width });
    persistColumnSizing();
  };
};
