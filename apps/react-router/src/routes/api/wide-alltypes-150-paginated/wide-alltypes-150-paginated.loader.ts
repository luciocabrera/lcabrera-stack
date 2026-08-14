import type { LoaderFunctionArgs } from 'react-router';

import { selectWideAlltypes150Page } from '@/routes/wide-alltypes-150/.server/wideAlltypes150.service';

import { parseWideAlltypes150PageParams } from './parseWideAlltypes150PageParams.util';

/**
 * Resource route serving a page of `wide_alltypes_150` for the route's
 * infinite-scroll load-more. Runs the query server-side via the generic
 * `@lcabrera/server` executors and returns a raw JSON
 * `{ data, hasMore, total }` Response — the client consumes it with plain
 * `fetch`, not the single-fetch protocol.
 *
 * It replaces the external `GET /wide-alltypes-150/paginated`, field for field,
 * so the showcase renders with nothing running but Postgres (#687). `total` is
 * on every page, not only the first, because that is what the endpoint it
 * replaces answered and what this route's table reads.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const { limit, skip, sorting } = parseWideAlltypes150PageParams(
    url.searchParams,
  );

  const page = await selectWideAlltypes150Page({
    limit,
    offset: skip,
    sorting,
  });

  return Response.json(page);
};
