import type { RouteConfig } from '@react-router/dev/routes';

import { route } from '@react-router/dev/routes';

export default [
  route('/', 'routes/orders/root.ts', [
    route('group', 'routes/orders/group/root.ts'),
  ]),
  route('_action/persist-cookie', 'routes/api/persist-cookie/root.ts'),
  route('_action/orders/delete', 'routes/api/orders-delete/root.ts'),
  route('_api/orders/page', 'routes/api/orders-page/root.ts'),
] satisfies RouteConfig;
