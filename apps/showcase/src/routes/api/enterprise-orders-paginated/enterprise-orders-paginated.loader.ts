import type { LoaderFunctionArgs } from 'react-router';

import { selectOrdersPage } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';
import { resolveOrdersPageRead } from '@/routes/enterprise-orders/.server/resolveOrdersPageRead.util';

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
