import type { ActionFunctionArgs } from 'react-router';

import { redirect } from 'react-router';

import { applySearchParamUpdates } from './applySearchParamUpdates.util';
import { buildSetCookieHeaders } from './buildSetCookieHeaders.util';

type CookieEntry = {
  key: string;
  searchParamKey: string;
  searchParamValue: string;
  value: string;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const currentUrl = formData.get('currentUrl');
  const entriesRaw = formData.get('entries');

  if (typeof entriesRaw !== 'string' || typeof currentUrl !== 'string') {
    return new Response('Missing entries or currentUrl', { status: 400 });
  }

  const entries = JSON.parse(entriesRaw) as readonly CookieEntry[];
  const url = new URL(currentUrl, request.url);

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const headers = buildSetCookieHeaders({ entries, expiresAt });

  const { changed, searchParams } = applySearchParamUpdates({
    searchParams: url.searchParams,
    updates: entries.map(({ searchParamKey, searchParamValue }) => ({
      key: searchParamKey,
      value: searchParamValue,
    })),
  });

  if (!changed) {
    return new Response(undefined, { headers, status: 204 });
  }

  url.search = searchParams.toString();
  return redirect(url.href, { headers });
};
