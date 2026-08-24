import type { Pagination } from '#ui/types/ui.types';

type OnLoadMore<TResponse, TData = unknown> = (
  params: Pagination<TData>,
) => Promise<TResponse>;

export const getRequiredOnLoadMore = <TResponse, TData = unknown>(
  onLoadMore: OnLoadMore<TResponse, TData> | undefined,
) => {
  if (!onLoadMore) {
    throw new Error('onLoadMore callback is required');
  }

  return onLoadMore;
};
