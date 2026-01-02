import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home/root.ts'),
  route('settings', 'routes/settings/root.ts'),
  route('car-sales', 'routes/car-sales/root.ts'),
  route('car-sales-infinite', 'routes/car-sales-infinite/root.ts'),
] satisfies RouteConfig;
