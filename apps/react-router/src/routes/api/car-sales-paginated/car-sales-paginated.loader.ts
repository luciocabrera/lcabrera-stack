import type { LoaderFunctionArgs } from 'react-router';

import { selectCarSalesPage } from '@/routes/car-sales/.server/carSales.service';

import { parseCarSalesPageParams } from './parseCarSalesPageParams.util';

/**
 * Resource route serving a page of car sales for the infinite-scroll load-more
 * of `/car-sales-infinite`. Runs the query server-side via the generic
 * `@lcabrera/server` executors and returns a raw JSON `{ data, hasMore, total }`
 * Response — the client consumes it with plain `fetch`, not the single-fetch
 * protocol.
 *
 * It replaces the external `GET /car-sales/paginated`, field for field, so the
 * showcase renders with nothing running but Postgres (#687). `total` is on
 * every page, not only the first, because that is what the endpoint it replaces
 * answered and what this route's table reads.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const { limit, skip, sorting } = parseCarSalesPageParams(url.searchParams);

  const page = await selectCarSalesPage({ limit, offset: skip, sorting });

  return Response.json(page);
};
