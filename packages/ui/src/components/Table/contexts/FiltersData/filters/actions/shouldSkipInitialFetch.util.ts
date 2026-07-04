type FilterDataSnapshot = {
  readonly data: readonly unknown[];
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly totalLoadedRows: number;
  readonly totalRows: number;
};

type ShouldSkipInitialFetchArgs = {
  readonly currentFilter: FilterDataSnapshot;
};

/**
 * Returns `true` when the initial fetch for a column's filter data should
 * be skipped — i.e., data has already been loaded or a fetch is in progress.
 */
export const shouldSkipInitialFetch = ({
  currentFilter,
}: ShouldSkipInitialFetchArgs): boolean =>
  currentFilter.data.length > 0 || currentFilter.isLoading;
