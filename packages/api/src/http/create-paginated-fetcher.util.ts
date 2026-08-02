import type { PaginatedFetchArgs } from './http.types.ts';

import { buildPaginatedQueryParams } from './build-paginated-query-params.util.ts';
import { fetchAndValidate } from './fetch-and-validate.util.ts';

type CreatePaginatedFetcherArgs<TResponse> = {
  readonly isValid: (value: unknown) => value is TResponse;
  /** Path appended to the resolved origin, e.g. `/car-sales/paginated`. */
  readonly path: string;
  /**
   * How this endpoint's origin is resolved, given the SSR request URL when
   * there is one — pass `getApiBaseUrl` for an endpoint on the API host. Omit
   * for a same-origin resource route, which needs no origin at all.
   */
  readonly resolveBaseUrl?: (requestUrl?: string) => string;
  readonly shapeErrorMessage?: string;
};

/**
 * Build a browser fetcher for one paginated endpoint: params in, validated page
 * out. Composes `buildPaginatedQueryParams` and `fetchAndValidate` and adds no
 * HTTP behaviour of its own — it exists so a route declares *which* endpoint
 * and *what shape* once, instead of re-assembling the same URL and the same
 * `!ok` check per entity.
 *
 * Transport-agnostic in the same way as `fetchDistinctValues`: pass `baseUrl`
 * per call for a BFF host, or omit it for a same-origin resource route.
 *
 * The guard is **required**. An unvalidated page is a cast, and a cast that is
 * wrong surfaces as a render crash three layers away from the response that
 * caused it.
 */
export const createPaginatedFetcher = <TResponse>({
  isValid,
  path,
  resolveBaseUrl,
  shapeErrorMessage = `Unexpected response shape from ${path}`,
}: CreatePaginatedFetcherArgs<TResponse>) => {
  return ({
    cursor,
    filter,
    limit,
    requestUrl,
    signal,
    skip,
    sorting,
    timeoutMs,
  }: PaginatedFetchArgs) => {
    const params = buildPaginatedQueryParams({
      cursor,
      filter,
      limit,
      skip,
      sorting,
    });

    return fetchAndValidate<TResponse>({
      isValid,
      shapeErrorMessage,
      signal,
      timeoutMs,
      url: `${resolveBaseUrl?.(requestUrl) ?? ''}${path}?${params.toString()}`,
    });
  };
};
