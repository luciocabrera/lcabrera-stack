import { TableRouteView } from '@lcabrera/ui';

import type { Order, OrdersPage } from './orders.types';

import { readOrdersPage } from './readOrdersPage.util';

export const Orders = () => (
  <TableRouteView<Order, OrdersPage> fetchPage={readOrdersPage} />
);
