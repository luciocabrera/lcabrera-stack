import type { LoaderFunctionArgs } from 'react-router';

import { selectWideAlltypes150Page } from '@/routes/wide-alltypes-150/.server/wideAlltypes150.service';

import { parseWideAlltypes150PageParams } from './parseWideAlltypes150PageParams.util';

/**
 * Runs the query server-side via the generic `@lcabrera/server` executors and returns a
 * raw JSON `{ data, hasMore, total }` Response — the client consumes it with plain
 * `fetch`, not the single-fetch protocol.
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
