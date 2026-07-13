import type { LoaderFunctionArgs } from 'react-router';

import { fetchDistinctValues, getApiBaseUrl } from '@repo/data-access/api';

import { parseFilterOptionsParams } from './parseFilterOptionsParams.util';

/**
 * Resource route serving distinct filter options for descriptors with
 * `transport: 'loader'`: validates the search params, then calls the BFF's
 * generic /api/distinct endpoint server-side (allow-list authorization
 * lives there). Returns the `{ hasMore, values }` page as a raw JSON
 * Response — the client tool consumes it with plain fetch, not the
 * single-fetch protocol.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const params = parseFilterOptionsParams(url.searchParams);

  if (!params) {
    return Response.json(
      { error: 'Missing schemaName, tableName, or columnName' },
      { status: 400 },
    );
  }

  const result = await fetchDistinctValues({
    ...params,
    baseUrl: `${getApiBaseUrl(request.url)}/distinct`,
  });

  return Response.json(result);
};
