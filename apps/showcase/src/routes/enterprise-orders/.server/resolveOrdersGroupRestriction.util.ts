import { resolveGroupRestriction } from '@lcabrera/server/db/olap/resolve-group-restriction.util';

import { selectOrderGroupKeyTruncations } from './enterpriseOrders.service';

type ResolveOrdersGroupRestrictionArgs = Omit<
  Parameters<typeof resolveGroupRestriction>[0],
  'selectTruncations'
>;

export const resolveOrdersGroupRestriction = (
  args: ResolveOrdersGroupRestrictionArgs,
) =>
  resolveGroupRestriction({
    ...args,
    selectTruncations: selectOrderGroupKeyTruncations,
  });
