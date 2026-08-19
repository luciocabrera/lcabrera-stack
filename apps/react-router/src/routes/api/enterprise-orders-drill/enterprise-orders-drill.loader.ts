import type { LoaderFunctionArgs } from 'react-router';

import { selectOrdersPage } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';
import { toOrderDrillRead } from '@/routes/enterprise-orders/.server/toOrderDrillRead.util';

import { parseOrdersPageParams } from '../enterprise-orders-paginated/parseOrdersPageParams.util';
import { parseOrderDrillGroup } from './parseOrderDrillParams.util';

/**
 * Resource route serving one bounded page of the rows underneath a group row
 * ([ADR-079](../../../../docs/decisions/ADR-079-drilling-from-a-group-to-its-rows.md)).
 *
 * **The translation stays server-side, and that is the point of the route.**
 * The client could assemble these filters itself — it holds the path values
 * since #775 — but the rules that make a drill *correct* are not obvious ones:
 * a NULL key becomes `IS NULL` rather than an equality that is never true, the
 * group-key terms come out of the sort, the primary key goes back in as a
 * tiebreaker, and the view's own grouping must not travel with the read or it
 * returns group rows again. `toOrderDrillRead` owns all four. A second
 * implementation on the client would be a second place for them to drift.
 *
 * **It reuses the paginated route's parser for filters, sort and limit** so a
 * drill is read under exactly the filters the grouped view was read under. Those
 * being dropped is the failure this whole path has to avoid, and it fails
 * quietly: every row would be a true fact about the table and wrong under the
 * heading it appears beneath.
 *
 * A refusal answers **400**, not an empty page. A subtotal, a grand total or an
 * incomplete path means the request and the row disagree about what is
 * drillable, which is a bug in the caller rather than a group that happens to
 * have no rows — and an empty `data` array would present it as the latter.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const group = parseOrderDrillGroup(url.searchParams);

  if (group === undefined) {
    return Response.json(
      { error: 'A drill request must name the group it drills.' },
      { status: 400 },
    );
  }

  const { filters, limit, sort } = parseOrdersPageParams(url.searchParams);
  const drill = toOrderDrillRead({
    filters,
    groupKeys: group.groupKeys,
    limit,
    sort,
    summary: group.summary,
  });

  if (drill.kind === 'refused') {
    return Response.json({ error: drill.reason }, { status: 400 });
  }

  const page = await selectOrdersPage(drill.read);

  return Response.json(page);
};
