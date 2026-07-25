type GetTotalRowsArgs<TResponse> = {
  readonly data: readonly string[];
  readonly dataTotalSelector?: (response: TResponse) => number | undefined;
  readonly response: TResponse;
};

/**
 * Resolves the total number of rows from a filter-data response.
 *
 * Uses `dataTotalSelector` when it yields a total; otherwise falls back to
 * `data.length` (treats the loaded page as the entire dataset). This is the
 * first page of a filter's options, so there is no earlier total to keep — the
 * loaded count is the honest answer when a selector is absent or declines.
 */
export const getTotalRows = <TResponse>({
  data,
  dataTotalSelector,
  response,
}: GetTotalRowsArgs<TResponse>) => dataTotalSelector?.(response) ?? data.length;
