import type { ActionFunctionArgs } from 'react-router';

import { buildCookieString } from '@/utils/storage/buildCookieString.util';

/**
 * Server action to persist a cookie via Set-Cookie header.
 *
 * Receives `key` and `value` from form data and returns a response
 * with the Set-Cookie header set. This allows client components to
 * trigger server-side cookie writes via useFetcher.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const key = formData.get('key');
  const value = formData.get('value');

  if (typeof key !== 'string' || typeof value !== 'string') {
    return new Response('Missing key or value', { status: 400 });
  }

  const headers = new Headers();
  headers.append('Set-Cookie', buildCookieString({ key, value }));

  return new Response(null, { headers, status: 204 });
};
