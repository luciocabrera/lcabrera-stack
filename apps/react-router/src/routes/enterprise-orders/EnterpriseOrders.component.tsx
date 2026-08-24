import { TableRouteView } from '@lcabrera/ui';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from './config';

import { fetchOrdersPage } from './fetchOrdersPage.service';

/**
 * This endpoint filters server-side, seeks and groups, and declares all three
 * capabilities on its loader `meta` (ADR-063) — none of them here. Keyset turns
 * the ADR-008 total order into a cursor so a deep page seeks instead of
 * counting (ADR-052), server filtering keeps a filtered scroll session
 * filtered, and grouping lets the header menu restate the query by one column.
 *
 * Opening a group is **not** among them any more. It was a `fetchDrill` prop
 * because a function does not survive the loader boundary (ADR-009); it is now
 * a `groupDetailsPath` on the same loader `meta` as everything else, so the
 * grid builds a link and this component passes nothing (#870).
 */
export const EnterpriseOrders = () => (
  <TableRouteView<EnterpriseOrderTableRow, EnterpriseOrdersResponse>
    fetchPage={fetchOrdersPage}
  />
);
