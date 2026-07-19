import { LOGIN_ROUTE } from './auth.constants';

type BuildLoginRedirectUrlArgs = {
  readonly request: Request;
};

/**
 * Builds the `/login?redirectTo=<current-url>` target a guard redirects an
 * unauthenticated request to, so login can return the user to where they were
 * headed. Only the same-origin path + search is preserved (never the origin),
 * and it is `encodeURIComponent`-escaped so nested query strings survive the
 * round-trip. Pure: a total function of the request URL.
 */
export const buildLoginRedirectUrl = ({
  request,
}: BuildLoginRedirectUrlArgs) => {
  const url = new URL(request.url);
  const redirectTo = `${url.pathname}${url.search}`;

  return `${LOGIN_ROUTE}?redirectTo=${encodeURIComponent(redirectTo)}`;
};
