import { TableRouteView } from '@lcabrera/ui';

import type {
  EnterpriseOrderListRow,
  EnterpriseOrdersResponse,
} from './config';

import { fetchOrdersPage } from './fetchOrdersPage.service';

/**
 * This route's endpoint is the only one that both filters server-side and
 * seeks. Both capabilities are declared on the loader `meta` (ADR-063), where
 * the loader can act on them too: keyset turns the ADR-008 total order into a
 * cursor so a deep page seeks instead of counting (ADR-052), and server
 * filtering keeps a filtered scroll session filtered.
 */
export const EnterpriseOrders = () => (
  <TableRouteView<EnterpriseOrderListRow, EnterpriseOrdersResponse>
    fetchPage={fetchOrdersPage}
  />
);
