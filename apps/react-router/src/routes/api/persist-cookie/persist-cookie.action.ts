import type { ActionFunctionArgs } from "react-router";

import { redirect } from "react-router";

import { buildCookieString } from "@/utils/storage/buildCookieString.util";

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
 * and applies search param changes in a single redirect.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const currentUrl = formData.get("currentUrl");
  const entriesRaw = formData.get("entries");

  if (typeof entriesRaw !== "string" || typeof currentUrl !== "string") {
    return new Response("Missing entries or currentUrl", { status: 400 });
  }

  const entries = JSON.parse(entriesRaw) as CookieEntry[];
  const url = new URL(currentUrl, request.url);
  const headers = new Headers();

  for (const { key, searchParamKey, searchParamValue, value } of entries) {
    headers.append("Set-Cookie", buildCookieString({ key, value }));

    if (searchParamKey) {
      if (searchParamValue) {
        url.searchParams.set(searchParamKey, searchParamValue);
      } else {
        url.searchParams.delete(searchParamKey);
      }
    }
  }

  return redirect(url.href, { headers });
};
