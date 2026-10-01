import { TableGroupDetailsView } from '@lcabrera/ui';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from '../config';

import { ENTERPRISE_ORDERS_PATH } from '../config';
import { fetchOrdersPage } from '../fetchOrdersPage.service';

export const GroupDetails = () => (
  <TableGroupDetailsView<EnterpriseOrderTableRow, EnterpriseOrdersResponse>
    closePath={ENTERPRISE_ORDERS_PATH}
    fetchPage={fetchOrdersPage}
  />
);
