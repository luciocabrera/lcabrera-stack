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
