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
  // const baseSizing = Object.fromEntries(
  //   Object.entries(columnSizesState).filter(([key]) => key !== columnKey),
  // );
  // const newColumnSizing =
  //   columnSizing === undefined
  //     ? baseSizing
  //     : { ...baseSizing, [columnKey]: columnSizing };

  // return newColumnSizing as ColumnSizingState<TData>;

  const keys = Object.keys(
    columnSizesState,
  ) as (keyof ColumnSizingState<TData>)[];

  const initial = (
    columnSizing === undefined ? {} : { [columnKey]: columnSizing }
  ) as ColumnSizingState<TData>;

  return keys.reduce<ColumnSizingState<TData>>((acc, k) => {
    if (k !== (columnKey as keyof ColumnSizingState<TData>)) {
      acc[k] = columnSizesState[k];
    }
    return acc;
  }, initial);
};
