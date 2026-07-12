type GetTotalRowsArgs<TResponse> = {
  readonly data: readonly string[];
  readonly dataTotalSelector?: (response: TResponse) => number;
  readonly response: TResponse;
};

/**
 * Resolves the total number of rows from a filter-data response.
 *
 * Uses `dataTotalSelector` when provided; otherwise falls back to
 * `data.length` (treats the loaded page as the entire dataset).
 */
export const getTotalRows = <TResponse>({
  data,
  dataTotalSelector,
  response,
}: GetTotalRowsArgs<TResponse>) => {
  if (dataTotalSelector) {
    return dataTotalSelector(response);
  }

  return data.length;
};
