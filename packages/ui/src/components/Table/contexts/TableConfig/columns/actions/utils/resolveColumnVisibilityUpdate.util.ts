import type {
  ColumnVisibilityState,
  DataKey,
} from '@lcabrera/ui/components/Table/Table.types';

type ResolveColumnVisibilityUpdateArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly isVisible: boolean;
};

/**
 * Computes the next columnVisibility Set for a single-column show/hide toggle.
 * The Set stores HIDDEN column keys (see getEffectiveColumns.util.ts), so
 * showing a column removes it from the Set and hiding adds it.
 */
export const resolveColumnVisibilityUpdate = <TData>({
  columnKey,
  columnVisibility,
  isVisible,
}: ResolveColumnVisibilityUpdateArgs<TData>) => {
  const nextVisibility: ColumnVisibilityState<TData> = new Set(
    columnVisibility,
  );

  if (isVisible) {
    nextVisibility.delete(columnKey);
  } else {
    nextVisibility.add(columnKey);
  }

  return nextVisibility;
};
