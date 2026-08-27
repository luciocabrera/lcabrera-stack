import type { TableColumn } from '@lcabrera/ui/components/Table';

import { parseDrillGroup } from '@lcabrera/api/olap/parse-drill-group.util';
import { toGroupRestrictions } from '@lcabrera/server/db/olap/to-group-restrictions.util';

import type { EnterpriseOrderTableRow } from '@/routes/enterprise-orders/config';

import { selectOrderGroupKeyTruncations } from './enterpriseOrders.service';

type ToOrderGroupLockedFiltersArgs = {
  readonly columns: readonly TableColumn<EnterpriseOrderTableRow>[];
  readonly params: URLSearchParams;
};

/**
 * A token this route cannot read is refused, never ignored — `resolveGroupRead` answers
 * the same request with a refusal page. The precise reason ships with the package and is
 * already on screen in the grid; this says the one thing both reasons have in common,
 * because the alternative is an empty filter list, which reads as "nothing restricts these
 * rows" (ADR-087).
 */
const UNREADABLE_GROUP =
  'This view opens one group’s rows, and the link does not name a group that can be read.';

/**
 * This route's binding of the generic group restriction, as the table's own vocabulary:
 * the catalogue lookup a truncated key's label needs, which only the route can resolve
 * against its own table, and the refusal a route serving nothing but one group owes a
 * reader when the token does not parse.
 * The entries are a **statement**, never the mechanism: `toDrillRead` still scopes the read
 * from the token, and no `ColumnFilter` is derived from a group key (ADR-087 decision 4).
 */
export const toOrderGroupLockedFilters = async ({
  columns,
  params,
}: ToOrderGroupLockedFiltersArgs) => {
  const periods = parseDrillGroup(params)?.periods;

  const entries = toGroupRestrictions({
    columns,
    params,
    truncations: await selectOrderGroupKeyTruncations(periods),
  });

  return entries === undefined
    ? { entries: [], refusal: UNREADABLE_GROUP }
    : { entries };
};
