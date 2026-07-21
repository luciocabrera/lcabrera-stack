import type { DistinctValuesResponse } from './distinct.types.ts';

import { fetchAndValidate } from '../http/fetch-and-validate.util.ts';
import { isDistinctValuesResponse } from './is-distinct-values-response.util.ts';

type FetchDistinctValuesArgs = {
  readonly baseUrl: string;
  readonly columnName: string;
  readonly limit: number;
  readonly offset: number;
  readonly schemaName?: string;
  readonly signal?: AbortSignal;
  readonly tableName: string;
  readonly timeoutMs?: number;
};

/**
 * Fetches one page of distinct values for a column from a distinct-values
 * endpoint (`<baseUrl>?schemaName&tableName&columnName&limit&offset`).
 * Transport-agnostic: pass the BFF base (`getApiBaseUrl() + '/distinct'`)
 * or a same-origin resource-route path as `baseUrl`.
 *
 * `signal` and `timeoutMs` are forwarded untouched to `fetchAndValidate` and
 * are opt-in there — see its doc comment for why there is no default timeout.
 * This path is the one that pages: a filter dropdown scrolled quickly issues
 * overlapping requests, and `signal` is how a superseded one gets cancelled.
 */
export const fetchDistinctValues = async ({
  baseUrl,
  columnName,
  limit,
  offset,
  schemaName,
  signal,
  tableName,
  timeoutMs,
}: FetchDistinctValuesArgs) => {
  const query = new URLSearchParams({
    columnName,
    limit: String(limit),
    offset: String(offset),
    ...(schemaName !== undefined && { schemaName }),
    tableName,
  });

  return fetchAndValidate<DistinctValuesResponse>({
    isValid: isDistinctValuesResponse,
    shapeErrorMessage: 'Invalid distinct values response shape',
    signal,
    timeoutMs,
    url: `${baseUrl}?${query.toString()}`,
  });
};
