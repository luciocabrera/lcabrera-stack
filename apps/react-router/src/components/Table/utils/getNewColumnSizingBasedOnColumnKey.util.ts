import type { ColumnSizingState, DataKey } from '../Table.types';

type GetNewColumnSizingBasedOnColumnKeyArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnSizing?: number;
  readonly columnSizesState?: ColumnSizingState<TData>;
};

export const getNewColumnSizingBasedOnColumnKey = <TData>({
  columnKey,
  columnSizing,
  columnSizesState = {} as ColumnSizingState<TData>,
}: GetNewColumnSizingBasedOnColumnKeyArgs<TData>): ColumnSizingState<TData> => {
  // Sizing: remove this column entry, then re-add if size exists
  const baseSizing = Object.fromEntries(
    Object.entries(columnSizesState).filter(([key]) => key !== columnKey),
  );
  const newColumnSizing =
    columnSizing === undefined
      ? baseSizing
      : { ...baseSizing, [columnKey]: columnSizing };

  return newColumnSizing as ColumnSizingState<TData>;
};
