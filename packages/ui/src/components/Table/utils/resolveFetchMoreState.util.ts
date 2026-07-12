type ResolveFetchMoreStateArgs<TData, TResponse> = {
  readonly currentData: readonly TData[];
  readonly currentTotalRows?: number;
  readonly dataSelector?: (response: TResponse) => readonly TData[];
  readonly dataTotalSelector?: (response: TResponse) => number;
  readonly response: TResponse;
};

export const resolveFetchMoreState = <TData, TResponse>({
  currentData,
  currentTotalRows,
  dataSelector,
  dataTotalSelector,
  response,
}: ResolveFetchMoreStateArgs<TData, TResponse>) => {
  const data = dataSelector ? dataSelector(response) : [];
  const combinedData = [...currentData, ...data];
  const totalLoadedRows = combinedData.length;
  const totalRows = dataTotalSelector
    ? dataTotalSelector(response)
    : (currentTotalRows ?? totalLoadedRows);

  return {
    combinedData,
    hasMore: totalRows > totalLoadedRows,
    totalLoadedRows,
    totalRows,
  };
};

export type { ResolveFetchMoreStateArgs };
