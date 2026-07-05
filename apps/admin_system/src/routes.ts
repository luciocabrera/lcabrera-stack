import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home/root.ts'),
  route('_action/persist-cookie', 'routes/api/persist-cookie/root.ts'),
] satisfies RouteConfig;
