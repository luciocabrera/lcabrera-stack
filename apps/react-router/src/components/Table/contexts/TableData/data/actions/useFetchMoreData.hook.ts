import { useCallback, useRef } from 'react';

import type { PrefetchCache } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import type { FetchMoreDataArgs } from './fetchMoreData.types';

import { useTableDataContextValue } from '../useTableDataContextValue.hook';
import { executeFetchMore } from './fetchMoreData.util';

export const useFetchMoreData = <TData, TResponse>() => {
  const { dataStore } = useTableDataContextValue<TData>();
  const { metaStore } = useTableConfigContextValue<TData>();
  const isFetchingRef = useRef(false);
  const prefetchRef = useRef<PrefetchCache<TResponse>>({
    data: undefined,
    promise: undefined,
    skip: -1,
  });

  return useCallback(
    async (args: FetchMoreDataArgs<TData, TResponse>) =>
      executeFetchMore({
        args,
        dataStore,
        isFetchingRef,
        metaStore,
        prefetchRef,
      }),
    [dataStore, metaStore],
  );
};
