import type { Pagination } from '@/types/ui.types';

type OnLoadMore<TResponse> = (params: Pagination) => Promise<TResponse>;

/**
 * Asserts that `onLoadMore` is provided and returns it as a non-nullable
 * callback. Throws if the callback is absent.
 */
export const getRequiredOnLoadMore = <TResponse>(
  onLoadMore: OnLoadMore<TResponse> | undefined,
): OnLoadMore<TResponse> => {
  if (!onLoadMore) {
    throw new Error('onLoadMore callback is required');
  }

  return onLoadMore;
};
