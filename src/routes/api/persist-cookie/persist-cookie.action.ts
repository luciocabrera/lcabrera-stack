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
  const currentUrl = formData.get('currentUrl');
  const searchParamKey = formData.get('searchParamKey');
  const searchParamValue = formData.get('searchParamValue');

  if (typeof key !== 'string' || typeof value !== 'string') {
    return new Response('Missing key or value', { status: 400 });
  }

  const headers = new Headers();
  headers.append('Set-Cookie', buildCookieString({ key, value }));

  let nextSearch: string | undefined;
  if (typeof currentUrl === 'string' && typeof searchParamKey === 'string') {
    const url = new URL(currentUrl, request.url);

    if (typeof searchParamValue === 'string' && searchParamValue.length > 0) {
      url.searchParams.set(searchParamKey, searchParamValue);
    } else {
      url.searchParams.delete(searchParamKey);
    }

    nextSearch = url.search;
  }

  return Response.json({ nextSearch }, { headers, status: 200 });
};
