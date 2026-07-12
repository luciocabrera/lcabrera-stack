import type { ActionFunctionArgs } from 'react-router';

import { buildCookieString } from '@repo/ui/utils/storage/buildCookieString.util';
import { redirect } from 'react-router';

type CookieEntry = {
  key: string;
  searchParamKey: string;
  searchParamValue: string;
  value: string;
};

/**
 * Server action to persist cookies via Set-Cookie headers.
 *
 * Receives a JSON array of entries from form data. Each entry contains
 * a cookie key/value pair and optional search param updates.
 * Sets all cookies server-side via multiple Set-Cookie response headers
 * and redirects only when the requested search param updates effectively
 * change the URL.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const currentUrl = formData.get('currentUrl');
  const entriesRaw = formData.get('entries');

  if (typeof entriesRaw !== 'string' || typeof currentUrl !== 'string') {
    return new Response('Missing entries or currentUrl', { status: 400 });
  }

  const entries = JSON.parse(entriesRaw) as CookieEntry[];
  const url = new URL(currentUrl, request.url);
  const headers = new Headers();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  let hasEffectiveQueryChange = false;

  for (const { key, searchParamKey, searchParamValue, value } of entries) {
    if (key && value) {
      headers.append(
        'Set-Cookie',
        buildCookieString({ expiresAt, key, value }),
      );
    }

    if (searchParamKey) {
      const currentSearchParamValue =
        url.searchParams.get(searchParamKey) || undefined;
      const nextSearchParamValue = searchParamValue || undefined;

      if (currentSearchParamValue !== nextSearchParamValue) {
        hasEffectiveQueryChange = true;
      }

      if (nextSearchParamValue) {
        url.searchParams.set(searchParamKey, nextSearchParamValue);
      } else {
        url.searchParams.delete(searchParamKey);
      }
    }
  }

  if (!hasEffectiveQueryChange) {
    return new Response(undefined, { headers, status: 204 });
  }

  return redirect(url.href, { headers });
};
