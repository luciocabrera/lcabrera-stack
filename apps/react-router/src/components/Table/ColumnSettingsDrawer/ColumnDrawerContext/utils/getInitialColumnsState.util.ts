import type { ColumnDrawerState } from "../ColumnDrawerContext.types.ts";

type GetInitialTableStateArgs<TData> = Partial<ColumnDrawerState<TData>>;

export const getInitialColumnsState = <TData>({
  columnFilter,
  columnKey,
  columnPinning,
  columnSizing,
  sorting,
}: GetInitialTableStateArgs<TData>) => {
  return {
    columnFilter,
    columnKey,
    columnPinning,
    columnSizing,
    sorting,
  };
};
