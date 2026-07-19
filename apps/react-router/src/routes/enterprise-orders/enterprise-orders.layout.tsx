import { Outlet } from 'react-router';

import { EnterpriseOrders } from './EnterpriseOrders.component';

/**
 * The enterprise-orders list route. Renders the data table plus an `<Outlet/>`
 * so the create/view/edit child routes overlay as modals on top of the list
 * (feature plan §4 — route-driven modals over the table).
 */
export const EnterpriseOrdersLayout = () => (
  <>
    <EnterpriseOrders />
    <Outlet />
  </>
);
