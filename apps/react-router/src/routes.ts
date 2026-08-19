import type { RouteConfig } from '@react-router/dev/routes';

import { index, route } from '@react-router/dev/routes';

export default [
  index('routes/home/root.ts'),
  route('login', 'routes/login/root.ts'),
  route('logout', 'routes/logout/root.ts'),
  route('_action/persist-cookie', 'routes/api/persist-cookie/root.ts'),
  route(
    '_action/enterprise-orders/delete',
    'routes/api/enterprise-orders-delete/root.ts',
  ),
  route('_api/filter-options', 'routes/api/filter-options/root.ts'),
  route(
    '_api/enterprise-orders/paginated',
    'routes/api/enterprise-orders-paginated/root.ts',
  ),
  route(
    '_api/enterprise-orders/drill',
    'routes/api/enterprise-orders-drill/root.ts',
  ),
  route('_api/car-sales/paginated', 'routes/api/car-sales-paginated/root.ts'),
  route(
    '_api/wide-alltypes-150/paginated',
    'routes/api/wide-alltypes-150-paginated/root.ts',
  ),
  route('settings', 'routes/settings/root.ts'),
  route('car-sales', 'routes/car-sales/root.ts'),
  route('car-sales-infinite', 'routes/car-sales-infinite/root.ts'),
  route('enterprise-orders', 'routes/enterprise-orders/root.ts', [
    route('new', 'routes/enterprise-orders/new-order/root.tsx'),
    route('edit/:orderId', 'routes/enterprise-orders/edit-order/root.tsx'),
    route(
      'view/:orderId',
      'routes/enterprise-orders/order-detail-view/root.ts',
    ),
    route(':orderId', 'routes/enterprise-orders/order-detail/root.ts'),
  ]),
  route('wide-alltypes-150', 'routes/wide-alltypes-150/layout.ts', [
    index('routes/wide-alltypes-150/root.ts'),
  ]),
] satisfies RouteConfig;
