import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home/root.ts'),
  route('settings', 'routes/settings/root.ts'),
] satisfies RouteConfig;
