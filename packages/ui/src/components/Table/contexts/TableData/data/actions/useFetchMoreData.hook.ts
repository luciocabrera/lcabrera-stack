import type { PrefetchCache } from '@lcabrera/ui/types/ui.types';

import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useRef } from 'react';

import type { FetchMoreDataArgs } from './fetchMoreData.types';

import { useTableDataContextValue } from '../useTableDataContextValue.hook';
import { executeFetchMore } from './executeFetchMore.util';

export const useFetchMoreData = <TData, TResponse>() => {
  const { dataStore } = useTableDataContextValue<TData>();
  const { metaStore } = useTableConfigContextValue<TData>();
  const isFetchingRef = useRef(false);
  const prefetchRef = useRef<PrefetchCache<TResponse>>({
    data: undefined,
    promise: undefined,
    skip: -1,
  });

  return async (args: FetchMoreDataArgs<TData, TResponse>) =>
    executeFetchMore({
      args,
      dataStore,
      isFetchingRef,
      metaStore,
      prefetchRef,
    });
};
