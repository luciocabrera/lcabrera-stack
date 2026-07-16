import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import type { ColumnSizingArgs } from './useSetColumnSizingWithoutSync.hook';

import { persistColumnSizing, writeColumnSizing } from './utils';

/**
 * Applies a completed column resize: writes the new width and persists it.
 * Pass `width: undefined` to restore the column's default.
 *
 * Persistence lives here rather than at the call site, matching how
 * `useSetColumnPinning` and `useSetColumnSorting` own theirs — a caller should
 * never have to remember to pair a width change with a separate sync.
 *
 * The one caller that opts out is `useColumnDragSession`, which writes a width
 * per animation frame; see {@link useSetColumnSizingWithoutSync}.
 */
export const useSetColumnSizing = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();

  return ({ columnKey, width }: ColumnSizingArgs<TData>) => {
    writeColumnSizing<TData>({ columnKey, columnsStore, width });
    persistColumnSizing<TData>({ columnsStore, metaStore });
  };
};
