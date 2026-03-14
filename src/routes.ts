import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home/root.ts'),
  route('_action/persist-cookie', 'routes/api/persist-cookie/root.ts'),
  route('settings', 'routes/settings/root.ts'),
  route('car-sales', 'routes/car-sales/root.ts'),
  route('car-sales-infinite', 'routes/car-sales-infinite/root.ts'),
  route('enterprise-orders', 'routes/enterprise-orders/layout.ts', [
    index('routes/enterprise-orders/root.ts'),
    route(':orderId', 'routes/enterprise-orders/order-detail/root.ts'),
  ]),
] satisfies RouteConfig;
