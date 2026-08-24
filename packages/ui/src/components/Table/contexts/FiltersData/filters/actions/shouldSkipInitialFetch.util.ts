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

export const shouldSkipInitialFetch = ({
  currentFilter,
}: ShouldSkipInitialFetchArgs) =>
  currentFilter.data.length > 0 || currentFilter.isLoading;
