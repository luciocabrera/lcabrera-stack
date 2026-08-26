import type { LoaderFunctionArgs } from 'react-router';

import { selectOrdersPage } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';
import { resolveOrdersPageRead } from '@/routes/enterprise-orders/.server/resolveOrdersPageRead.util';

/**
 * A page of enterprise orders for the table's infinite scroll — the whole table, or one
 * group's rows when a `group` param names one (ADR-087).
 * A refusal is a page carrying an error rather than a `400`, so the table can say which
 * group could not be opened and why (ADR-068).
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const resolved = await resolveOrdersPageRead(url.searchParams);

  if (resolved.kind === 'refused') {
    return Response.json({
      data: [],
      error: { kind: 'unexpected', message: resolved.message },
      hasMore: false,
      total: 0,
    });
  }

  return Response.json(await selectOrdersPage(resolved.read));
};
