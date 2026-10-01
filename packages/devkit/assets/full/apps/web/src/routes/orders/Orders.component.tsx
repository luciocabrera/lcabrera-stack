import { TableRouteView } from '@lcabrera/ui';
import { Outlet } from 'react-router';

import type { OrderRow, OrdersPage } from './orders.types';

import { readOrdersPage } from './readOrdersPage.util';

export const Orders = () => (
  <>
    <TableRouteView<OrderRow, OrdersPage> fetchPage={readOrdersPage} />
    <Outlet />
  </>
);
