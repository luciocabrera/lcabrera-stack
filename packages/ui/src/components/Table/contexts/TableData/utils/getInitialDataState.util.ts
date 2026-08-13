import type { TableDataState } from '#ui/components/Table/Table.types';

type GetInitialDataStateArgs<TData> = Partial<TableDataState<TData>>;

export const getInitialDataState = <TData>({
  data = [],
  // Named here, and unconditionally in the object below, so the key is present
  // even when the caller omitted it. The provider commits this through the
  // store's **shallow merge**, which keeps every key the next state does not
  // name — so an absent `error` would leave the previous read's refusal on
  // screen after the navigation that resolved it. It takes no default: the one
  // it would have is what destructuring already produces.
  error,
  isLoading = true,
  isLoadingMore = false,
  totalRows = 0,
}: GetInitialDataStateArgs<TData>) => {
  const totalLoadedRows = data.length;
  return {
    data,
    error,
    hasMore: totalRows > totalLoadedRows,
    isLoading,
    isLoadingMore,
    totalLoadedRows,
    totalRows,
  };
};
