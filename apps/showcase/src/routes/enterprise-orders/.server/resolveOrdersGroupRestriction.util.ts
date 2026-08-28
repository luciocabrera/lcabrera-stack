import { resolveGroupRestriction } from '@lcabrera/server/db/olap/resolve-group-restriction.util';

import { selectOrderGroupKeyTruncations } from './enterpriseOrders.service';

type ResolveOrdersGroupRestrictionArgs = Omit<
  Parameters<typeof resolveGroupRestriction>[0],
  'selectTruncations'
>;

/** This route's binding of the generic group restriction (ADR-082, ADR-094). */
export const resolveOrdersGroupRestriction = (
  args: ResolveOrdersGroupRestrictionArgs,
) =>
  resolveGroupRestriction({
    ...args,
    selectTruncations: selectOrderGroupKeyTruncations,
  });
