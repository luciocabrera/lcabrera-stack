import { TableRouteView } from '@lcabrera/ui';

import type {
  EnterpriseOrderListRow,
  EnterpriseOrdersResponse,
} from './config';

import { fetchOrdersPage } from './fetchOrdersPage.service';

/**
 * This endpoint both filters server-side and seeks, and declares both
 * capabilities on its loader `meta` (ADR-063). Keyset turns the ADR-008 total
 * order into a cursor so a deep page seeks instead of counting (ADR-052), and
 * server filtering keeps a filtered scroll session filtered.
 */
export const EnterpriseOrders = () => (
  <TableRouteView<EnterpriseOrderListRow, EnterpriseOrdersResponse>
    fetchPage={fetchOrdersPage}
  />
);
