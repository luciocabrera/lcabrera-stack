import type { LoaderFunctionArgs } from 'react-router';

import { selectOrdersPage } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';

import { parseOrdersPageParams } from './parseOrdersPageParams.util';

/**
 * Resource route serving a page of enterprise orders for the table's
 * infinite-scroll load-more. Runs the query server-side via the generic
 * /server executors and returns a raw JSON `{ data, hasMore, total }`
 * Response — the client consumes it with plain `fetch`, not the single-fetch
 * protocol.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const { filters, limit, skip, sort } = parseOrdersPageParams(
    url.searchParams,
  );

  const page = await selectOrdersPage({ filters, limit, offset: skip, sort });

  return Response.json(page);
};
