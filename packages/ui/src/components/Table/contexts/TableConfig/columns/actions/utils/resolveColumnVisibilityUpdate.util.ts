import type {
  ColumnVisibilityState,
  DataKey,
} from '#ui/components/Table/Table.types';

type ResolveColumnVisibilityUpdateArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly isVisible: boolean;
};

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
