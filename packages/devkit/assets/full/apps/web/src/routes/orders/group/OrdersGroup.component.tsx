import { TableGroupDetailsView } from '@lcabrera/ui';

import type { OrderRow, OrdersPage } from '../orders.types';

import { ORDERS_PATH } from '../Orders.constants';
import { readOrdersPage } from '../readOrdersPage.util';

export const OrdersGroup = () => (
  <TableGroupDetailsView<OrderRow, OrdersPage>
    closePath={ORDERS_PATH}
    fetchPage={readOrdersPage}
  />
);
