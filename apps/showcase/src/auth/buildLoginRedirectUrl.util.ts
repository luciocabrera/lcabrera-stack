/**
 * A guarded client-side navigation reaches the middleware as React Router's
 * single-fetch request, whose pathname carries a `.data` suffix. That suffix
 * must be stripped, or `redirectTo` captures a URL matching no route and login
 * bounces the user to the single-fetch endpoint — a silent root-boundary error —
 * instead of the page.
 */

import { LOGIN_ROUTE } from './auth.constants';

const SINGLE_FETCH_SUFFIX = '.data';

type BuildLoginRedirectUrlArgs = {
  readonly request: Request;
};

export const buildLoginRedirectUrl = ({
  request,
}: BuildLoginRedirectUrlArgs) => {
  const url = new URL(request.url);
  const pathname = url.pathname.endsWith(SINGLE_FETCH_SUFFIX)
    ? url.pathname.slice(0, -SINGLE_FETCH_SUFFIX.length)
    : url.pathname;
  const redirectTo = `${pathname}${url.search}`;

  return `${LOGIN_ROUTE}?redirectTo=${encodeURIComponent(redirectTo)}`;
};
