import { TableRouteView } from '@lcabrera/ui';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from './config';

import { fetchOrderDrill } from './fetchOrderDrill.service';
import { fetchOrdersPage } from './fetchOrdersPage.service';

/**
 * This endpoint filters server-side, seeks, groups, and serves a drilled page,
 * and declares all four capabilities on its loader `meta` (ADR-063) — none of
 * them here. Keyset turns the ADR-008 total order into a cursor so a deep page
 * seeks instead of counting (ADR-052), server filtering keeps a filtered scroll
 * session filtered, and grouping lets the header menu restate the query by one
 * column.
 *
 * `fetchDrill` is the one half of the drill that cannot be a flag: the
 * capability says the endpoint exists, this is the call that reaches it, and it
 * is a prop because a function does not survive the loader boundary (ADR-009,
 * ADR-079).
 */
export const EnterpriseOrders = () => (
  <TableRouteView<EnterpriseOrderTableRow, EnterpriseOrdersResponse>
    fetchDrill={fetchOrderDrill}
    fetchPage={fetchOrdersPage}
  />
);
