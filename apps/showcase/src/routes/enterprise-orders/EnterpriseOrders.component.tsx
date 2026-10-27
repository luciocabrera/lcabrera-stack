import { TableRouteView } from '@lcabrera/ui';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from './config';

export const EnterpriseOrders = () => (
  <TableRouteView<EnterpriseOrderTableRow, EnterpriseOrdersResponse> />
);
