import { TableRouteView } from '@lcabrera/ui';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from './config';

import { fetchOrdersPage } from './fetchOrdersPage.service';

/**
 * This endpoint filters server-side, seeks, and groups, and declares all three
 * capabilities on its loader `meta` (ADR-063) — none of them here. Keyset turns
 * the ADR-008 total order into a cursor so a deep page seeks instead of counting
 * (ADR-052), server filtering keeps a filtered scroll session filtered, and
 * grouping lets the header menu restate the query by one column.
 */
export const EnterpriseOrders = () => (
  <TableRouteView<EnterpriseOrderTableRow, EnterpriseOrdersResponse>
    fetchPage={fetchOrdersPage}
  />
);
