import { Outlet } from 'react-router';

import { EnterpriseOrders } from './EnterpriseOrders.component';

export const EnterpriseOrdersLayout = () => (
  <>
    <EnterpriseOrders />
    <Outlet />
  </>
);
