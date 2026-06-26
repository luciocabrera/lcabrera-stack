import { LOAD_MORE_PAGE_SIZE } from '@/components/Table/Table.constants';
import { getRequiredOnLoadMore } from '@/components/Table/utils/getRequiredOnLoadMore.util';

import type {
  FetchMoreRuntimeArgs,
  FetchMoreRuntimeResult,
} from './fetchMoreData.types';

export const getFetchMoreRuntime = <TData, TResponse>({
  args,
  dataState,
  metaState,
}: FetchMoreRuntimeArgs<TData, TResponse>): FetchMoreRuntimeResult<
  TData,
  TResponse
> => {
  const { onLoadMore } = args;
  const currentData = dataState?.data ?? [];

  return {
    currentData,
    enablePrefetch: metaState?.enablePrefetch ?? false,
    pageSize: metaState?.loadMorePageSize ?? LOAD_MORE_PAGE_SIZE,
    requiredOnLoadMore: getRequiredOnLoadMore(onLoadMore),
  };
};
