type ResolveFetchMoreStateArgs<TData, TResponse> = {
  readonly currentData: readonly TData[];
  readonly currentTotalRows?: number;
  readonly dataSelector?: (response: TResponse) => readonly TData[];
  readonly dataTotalSelector?: (response: TResponse) => number | undefined;
  readonly response: TResponse;
};

/**
 * `dataTotalSelector` may return `undefined`, and a server is expected to use that: the
 * total cannot change within a scroll session, so re-counting the filtered set on every
 * page is work with a known answer.
 */
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
  const totalRows =
    dataTotalSelector?.(response) ?? currentTotalRows ?? totalLoadedRows;

  return {
    combinedData,
    hasMore: totalRows > totalLoadedRows,
    totalLoadedRows,
    totalRows,
  };
};

export type { ResolveFetchMoreStateArgs };
