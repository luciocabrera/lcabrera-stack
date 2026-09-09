import type { TStore } from '#ui/hooks/useStore.hook';

import { toTableResponseError } from '#ui/components/Table/utils/toTableResponseError.util';

import type { DataState } from './fetchMoreData.types';

type CommitFetchMoreErrorArgs<TData> = {
  readonly dataStore: TStore<DataState<TData>>;
  readonly error: unknown;
};

export const commitFetchMoreError = <TData>({
  dataStore,
  error,
}: CommitFetchMoreErrorArgs<TData>) => {
  dataStore.set({
    error: toTableResponseError({
      error,
      fallback: 'Failed to load more data',
    }),
    isLoadingMore: false,
  });
};
