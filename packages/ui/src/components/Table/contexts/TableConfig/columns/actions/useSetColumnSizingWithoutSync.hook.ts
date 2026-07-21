import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { writeColumnSizing } from './utils';

export type ColumnSizingArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly width: number | undefined;
};

/**
 * Writes a column width to the columns store and skips the cookie write that
 * {@link useSetColumnSizing} pairs with it.
 *
 * This exists for one caller: `useColumnDragSession`, which emits a width every
 * animation frame and would otherwise re-serialize and rewrite the cookie ~60
 * times a second for a single drag. It persists once when the gesture ends.
 *
 * Every other resize — a keypress, a double-click reset, a preset button — is a
 * completed interaction and wants {@link useSetColumnSizing}.
 */
export const useSetColumnSizingWithoutSync = <TData>() => {
  const { columnsStore } = useTableConfigContextValue<TData>();

  return ({ columnKey, width }: ColumnSizingArgs<TData>) => {
    writeColumnSizing<TData>({ columnKey, columnsStore, width });
  };
};
