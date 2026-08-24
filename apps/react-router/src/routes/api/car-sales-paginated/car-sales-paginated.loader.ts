import type { LoaderFunctionArgs } from 'react-router';

import { selectCarSalesPage } from '@/routes/car-sales/.server/carSales.service';

import { parseCarSalesPageParams } from './parseCarSalesPageParams.util';

/**
 * Runs the query server-side via the generic `@lcabrera/server` executors and returns a
 * raw JSON `{ data, hasMore, total }` Response — the client consumes it with plain
 * `fetch`, not the single-fetch protocol.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const { limit, skip, sorting } = parseCarSalesPageParams(url.searchParams);

  const page = await selectCarSalesPage({ limit, offset: skip, sorting });

  return Response.json(page);
};
