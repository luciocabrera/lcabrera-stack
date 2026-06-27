import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home/root.ts'),
  route('_action/persist-cookie', 'routes/api/persist-cookie/root.ts'),
  route('settings', 'routes/settings/root.ts'),
  route('car-sales', 'routes/car-sales/root.ts'),
  route('car-sales-infinite', 'routes/car-sales-infinite/root.ts'),
  route('enterprise-orders', 'routes/enterprise-orders/layout.ts', [
    index('routes/enterprise-orders/root.tsx'),
    route(':orderId', 'routes/enterprise-orders/order-detail/root.ts'),
  ]),
  route('wide-alltypes-150', 'routes/wide-alltypes-150/layout.ts', [
    index('routes/wide-alltypes-150/root.ts'),
  ]),
] satisfies RouteConfig;
