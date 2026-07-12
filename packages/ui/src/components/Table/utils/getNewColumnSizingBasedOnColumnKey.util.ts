import type { ColumnSizingState, DataKey } from '../Table.types';

type GetNewColumnSizingBasedOnColumnKeyArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnSizesState?: ColumnSizingState<TData>;
  readonly columnSizing?: number;
};

export const getNewColumnSizingBasedOnColumnKey = <TData>({
  columnKey,
  columnSizesState = {} as ColumnSizingState<TData>,
  columnSizing,
}: GetNewColumnSizingBasedOnColumnKeyArgs<TData>) => {
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
