import type { TableMetaState } from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

import { getErrorMessage } from '@repo/utils/errors/get-error-message.util';

import type { DataState } from './fetchMoreData.types';

type CommitFetchMoreErrorArgs<TData> = {
  readonly dataStore: TStore<DataState<TData>>;
  readonly error: unknown;
  readonly metaStore: TStore<TableMetaState>;
};

export const commitFetchMoreError = <TData>({
  dataStore,
  error,
  metaStore,
}: CommitFetchMoreErrorArgs<TData>) => {
  const message = getErrorMessage({
    error,
    fallback: 'Failed to load more data',
  });
  metaStore.set({
    error: message,
  });

  dataStore.set({
    isLoadingMore: false,
  });
};
