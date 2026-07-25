import type { Pagination } from '@lcabrera/ui/types/ui.types';

type OnLoadMore<TResponse, TData = unknown> = (
  params: Pagination<TData>,
) => Promise<TResponse>;

/**
 * Asserts that `onLoadMore` is provided and returns it as a non-nullable
 * callback. Throws if the callback is absent.
 */
export const getRequiredOnLoadMore = <TResponse, TData = unknown>(
  onLoadMore: OnLoadMore<TResponse, TData> | undefined,
) => {
  if (!onLoadMore) {
    throw new Error('onLoadMore callback is required');
  }

  return onLoadMore;
};
