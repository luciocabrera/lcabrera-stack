import type { LoaderFunctionArgs } from 'react-router';

import { selectOrdersPage } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';
import { resolveOrdersPageRead } from '@/routes/enterprise-orders/.server/resolveOrdersPageRead.util';

/**
 * Resource route serving a page of enterprise orders for the table's
 * infinite-scroll load-more. Runs the query server-side via the generic
 * /server executors and returns a raw JSON `{ data, hasMore, total? }`
 * Response — the client consumes it with plain `fetch`, not the single-fetch
 * protocol.
 *
 * **It serves a group's rows too, and that is why `/drill` is gone** (#870).
 * A `group` param scopes the read to one group row; without it the read is the
 * unscoped one it has always been. The group-details modal pages through here,
 * so one endpoint answers both, and `resolveOrdersPageRead` is the single place
 * that decides which — see it for why the group travels as a token rather than
 * as filters, and why an unreadable token is refused rather than ignored.
 *
 * **A refusal is a page carrying an error, not a 400.** The old `/drill` route
 * answered `400`, which the client could not parse as a page, so it threw and
 * the named reason was discarded in a generic failure state. Rendering it as
 * data is what lets the table say which group could not be opened and why
 * (ADR-068).
 *
 * `skip === 0` is the first page of a scroll session, and the only page that
 * pays for the `COUNT` (#402): the total cannot change while the session runs,
 * so every later page would be re-deriving a number the client already holds.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const resolved = await resolveOrdersPageRead(url.searchParams);

  if (resolved.kind === 'refused') {
    return Response.json({
      data: [],
      error: resolved.error,
      hasMore: false,
      total: 0,
    });
  }

  return Response.json(await selectOrdersPage(resolved.read));
};
