import { TableRouteView } from '@lcabrera/ui';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from './config';

import { fetchOrdersPage } from './fetchOrdersPage.service';

export const EnterpriseOrders = () => (
  <TableRouteView<EnterpriseOrderTableRow, EnterpriseOrdersResponse>
    fetchPage={fetchOrdersPage}
  />
);
