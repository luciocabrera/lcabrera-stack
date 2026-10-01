import type { PaginatedFetchArgs } from './http.types.ts';

import { OLAP_DRILL_GROUP_PARAM } from '../olap/olap.constants.ts';
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
    group,
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

    if (group !== undefined) params.set(OLAP_DRILL_GROUP_PARAM, group);

    return fetchAndValidate<TResponse>({
      isValid,
      shapeErrorMessage,
      signal,
      timeoutMs,
      url: `${resolveBaseUrl?.(requestUrl) ?? ''}${path}?${params.toString()}`,
    });
  };
};
