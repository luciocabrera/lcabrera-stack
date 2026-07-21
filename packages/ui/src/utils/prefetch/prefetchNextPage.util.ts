import type { Pagination, PrefetchCache } from '@lcabrera/ui/types/ui.types';

type PrefetchNextPageArgs<TResponse> = {
  readonly limit: number;
  readonly nextSkip: number;
  readonly onLoadMore: (params: Pagination) => Promise<TResponse>;
};

/**
 * Creates a prefetch request for the next page of data.
 * Returns the initial cache state and a promise that resolves to the
 * final cache state (success or failure). The consumer is responsible
 * for applying these values to the ref with a staleness check.
 */
export const prefetchNextPage = <TResponse>({
  limit,
  nextSkip,
  onLoadMore,
}: PrefetchNextPageArgs<TResponse>) => {
  const prefetchPromise = onLoadMore({
    limit,
    skip: nextSkip,
  });

  const initialCache: PrefetchCache<TResponse> = {
    data: undefined,
    promise: prefetchPromise,
    skip: nextSkip,
  };

  const resolution: Promise<PrefetchCache<TResponse>> = (async () => {
    try {
      const prefetchedResponse = await prefetchPromise;
      return {
        data: prefetchedResponse,
        promise: undefined,
        skip: nextSkip,
      };
    } catch {
      return {
        data: undefined,
        promise: undefined,
        skip: -1,
      };
    }
  })();

  return { initialCache, resolution };
};
