import type { LoaderFunctionArgs } from 'react-router';

import { selectOrdersPage } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';

import { parseOrdersPageParams } from './parseOrdersPageParams.util';

/**
 * Resource route serving a page of enterprise orders for the table's
 * infinite-scroll load-more. Runs the query server-side via the generic
 * /server executors and returns a raw JSON `{ data, hasMore, total? }`
 * Response — the client consumes it with plain `fetch`, not the single-fetch
 * protocol.
 *
 * `skip === 0` is the first page of a scroll session, and the only page that
 * pays for the `COUNT` (#402): the total cannot change while the session runs,
 * so every later page would be re-deriving a number the client already holds.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const { cursor, filters, limit, skip, sort } = parseOrdersPageParams(
    url.searchParams,
  );

  const page = await selectOrdersPage({
    cursor,
    filters,
    includeTotal: skip === 0,
    limit,
    offset: skip,
    sort,
  });

  return Response.json(page);
};
