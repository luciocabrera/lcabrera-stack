import type { DistinctValuesResponse } from './api.types';

import { fetchAndValidate } from './fetchAndValidate.util';
import { isDistinctValuesResponse } from './isDistinctValuesResponse.util';

type FetchDistinctValuesArgs = {
  readonly baseUrl: string;
  readonly columnName: string;
  readonly limit: number;
  readonly offset: number;
  readonly schemaName?: string;
  readonly tableName: string;
};

/**
 * Fetches one page of distinct values for a column from a distinct-values
 * endpoint (`<baseUrl>?schemaName&tableName&columnName&limit&offset`).
 * Transport-agnostic: pass the BFF base (`getApiBaseUrl() + '/distinct'`)
 * or a same-origin resource-route path as `baseUrl`.
 */
export const fetchDistinctValues = async ({
  baseUrl,
  columnName,
  limit,
  offset,
  schemaName,
  tableName,
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
    url: `${baseUrl}?${query.toString()}`,
  });
};
