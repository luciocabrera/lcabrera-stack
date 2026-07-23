import type { LoaderFunctionArgs } from 'react-router';

import { parseFilterOptionsParams } from '@lcabrera/api/distinct/parse-filter-options-params.util';
import { DEFAULT_FILTER_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';

import { selectDistinctFilterOptions } from './.server/distinct.service';

/**
 * Resource route serving distinct filter options for `transport: 'loader'`
 * descriptors: validates the search params, then reads the column's distinct
 * values straight from Postgres **server-side** via the app's own distinct
 * service — no api-server round-trip, the same self-sufficient model the row
 * loaders use. Returns the `{ hasMore, values }` page as a raw JSON Response —
 * the client tool consumes it with plain fetch, not the single-fetch protocol.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const params = parseFilterOptionsParams({
    defaultPageSize: DEFAULT_FILTER_PAGE_SIZE,
    searchParams: url.searchParams,
  });

  if (!params) {
    return Response.json(
      { error: 'Missing schemaName, tableName, or columnName' },
      { status: 400 },
    );
  }

  const page = await selectDistinctFilterOptions(params);

  if (!page) {
    return Response.json(
      { error: 'Unsupported distinct source or column' },
      { status: 400 },
    );
  }

  return Response.json(page);
};
