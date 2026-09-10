import type { RouteConfig } from '@react-router/dev/routes';

import { index, route } from '@react-router/dev/routes';

export default [
  index('routes/orders/root.ts'),
  route('_action/persist-cookie', 'routes/api/persist-cookie/root.ts'),
] satisfies RouteConfig;
