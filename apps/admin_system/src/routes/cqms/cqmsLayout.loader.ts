import type { LoaderFunctionArgs } from 'react-router';

import { requireUser } from '@/auth/requireUser.util';

/**
 * The auth gate for every /cqms/* page view (ADR-017). Nested loaders all
 * run per navigation, so gating the layout covers every child GET; child
 * ACTIONS run before loaders and therefore each call requireUser
 * themselves. Returns the user so child routes can read it via matches.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUser({ request });
  return { user };
};
