import type { TableColumn } from '@lcabrera/ui/components/Table';

import { parseDrillGroup } from '@lcabrera/api/olap/parse-drill-group.util';
import { toGroupHeading } from '@lcabrera/server/db/olap/to-group-heading.util';

import type { EnterpriseOrderTableRow } from '@/routes/enterprise-orders/config';

import { selectOrderGroupKeyTruncations } from './enterpriseOrders.service';

type ToOrderGroupHeadingArgs = {
  readonly columns: readonly TableColumn<EnterpriseOrderTableRow>[];
  readonly params: URLSearchParams;
};

/**
 * This route's binding of the generic heading: the catalogue lookup a truncated
 * key needs, which only the route can resolve against its own table.
 */
export const toOrderGroupHeading = async ({
  columns,
  params,
}: ToOrderGroupHeadingArgs) => {
  const periods = parseDrillGroup(params)?.periods;

  return toGroupHeading({
    columns,
    params,
    truncations: await selectOrderGroupKeyTruncations(periods),
  });
};
