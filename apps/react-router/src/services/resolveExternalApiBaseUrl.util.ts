import { getApiBaseUrl } from '@lcabrera/api/config/get-api-base-url.util';

import { readExternalApiUrl } from './readExternalApiUrl.util';

/**
 * The origin the external-API branch fetches from: `VITE_API_URL` when the app
 * was built with one, and `@lcabrera/api`'s own resolution otherwise.
 *
 * **The order is the point, and it deliberately inverts the package default.**
 * `getApiBaseUrl` ranks the SSR `requestUrl` first: given one, it returns the
 * localhost API host for a local hostname and `<origin>/api` for a deployed
 * one, and never reads `VITE_API_URL` at all. Passing it the request URL from a
 * loader therefore made the override select the external *branch* while the
 * request still went to whatever the request's own origin implied — so SSR and
 * the browser could talk to two different hosts, and on a dev machine the two
 * answers happen to be the same string, which is why it looked like it worked
 * (#701 review).
 *
 * `requestUrl` is still forwarded, because it is what `getApiBaseUrl` needs on
 * the fallback path — a loader has no `window` to derive an origin from.
 *
 * This lives in the app rather than in `@lcabrera/api` on purpose: reordering
 * the priorities inside the package would change published behaviour for every
 * consumer of `getApiBaseUrl`, which is a decision that needs its own issue and
 * a changeset. Overriding the order for one app needs neither.
 */
export const resolveExternalApiBaseUrl = (requestUrl?: string) =>
  readExternalApiUrl() ?? getApiBaseUrl(requestUrl);
