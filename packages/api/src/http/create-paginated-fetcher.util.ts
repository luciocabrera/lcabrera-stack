import type { PaginatedFetchArgs } from './http.types.ts';

import { buildPaginatedQueryParams } from './build-paginated-query-params.util.ts';
import { fetchAndValidate } from './fetch-and-validate.util.ts';

type CreatePaginatedFetcherArgs<TResponse> = {
  readonly isValid: (value: unknown) => value is TResponse;
  readonly path: string;
  readonly resolveBaseUrl?: (requestUrl?: string) => string;
  readonly shapeErrorMessage?: string;
};

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
