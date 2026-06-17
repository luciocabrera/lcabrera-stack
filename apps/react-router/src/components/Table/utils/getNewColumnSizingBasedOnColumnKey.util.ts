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
  const keys = Object.keys(
    columnSizesState,
  ) as (keyof ColumnSizingState<TData>)[];

  const initial = (
    columnSizing === undefined ? {} : { [columnKey]: columnSizing }
  ) as ColumnSizingState<TData>;

  return keys.reduce<ColumnSizingState<TData>>((acc, k) => {
    if (k !== columnKey) {
      acc[k] = columnSizesState[k];
    }
    return acc;
  }, initial);
};
