/**
 * Builds the per-column fetch used by filter-options action tests.
 */

type CreateStatusColumnFetchArgs<TFetch> = {
  readonly fetchFn: TFetch;
  readonly getStores: () => {
    readonly dataStore: unknown;
    readonly metaStore: unknown;
  };
};

type PrefetchRef = {
  readonly current: unknown;
};

export const createStatusColumnFetch = <TResult>({
  fetchFn,
  getStores,
}: CreateStatusColumnFetchArgs<(args: never) => TResult>) => {
  return (prefetchRef?: PrefetchRef) => {
    const { dataStore, metaStore } = getStores();

    return fetchFn({
      columnKey: 'status',
      filtersDataStore: dataStore,
      metaStore,
      ...(prefetchRef !== undefined && { prefetchRef }),
    } as never);
  };
};
