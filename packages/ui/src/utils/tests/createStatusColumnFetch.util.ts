/**
 * Builds the per-column fetch used by filter-options action tests.
 */

type CreateStatusColumnFetchArgs<
  TFiltersDataStore,
  TMetaStore,
  TResult,
  TPrefetchRef,
> = {
  readonly fetchFn: (
    args: StatusColumnFetchArgs<TFiltersDataStore, TMetaStore, TPrefetchRef>,
  ) => TResult;
  readonly getStores: () => {
    readonly dataStore: TFiltersDataStore;
    readonly metaStore: TMetaStore;
  };
};

type StatusColumnFetchArgs<TFiltersDataStore, TMetaStore, TPrefetchRef> = {
  readonly columnKey: 'status';
  readonly filtersDataStore: TFiltersDataStore;
  readonly metaStore: TMetaStore;
  readonly prefetchRef?: TPrefetchRef;
};

export const createStatusColumnFetch = <
  TFiltersDataStore,
  TMetaStore,
  TResult,
  TPrefetchRef = { readonly current: unknown },
>({
  fetchFn,
  getStores,
}: CreateStatusColumnFetchArgs<
  TFiltersDataStore,
  TMetaStore,
  TResult,
  TPrefetchRef
>) => {
  return (prefetchRef?: TPrefetchRef) => {
    const { dataStore, metaStore } = getStores();

    return fetchFn({
      columnKey: 'status',
      filtersDataStore: dataStore,
      metaStore,
      ...(prefetchRef !== undefined && { prefetchRef }),
    });
  };
};
