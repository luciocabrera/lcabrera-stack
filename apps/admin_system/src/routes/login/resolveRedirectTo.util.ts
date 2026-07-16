const DEFAULT_REDIRECT = '/cqms/projects';

type ResolveRedirectToArgs = {
  readonly url: string;
};

/**
 * Where to send a freshly logged-in user, from the login URL's `?redirectTo`.
 *
 * Only **same-origin absolute paths** are honored. `?redirectTo` is
 * attacker-supplied — anyone can hand out a login link — so an unchecked value
 * would turn the login form into an open redirect, handing a phisher a real
 * link on our own origin that lands on their page after a genuine login.
 *
 * Rejected, each falling back to the default:
 * - `//evil.example` — protocol-relative, reads as a path but leaves the origin
 * - `https://evil.example` — fully qualified
 * - anything not starting with `/` (relative paths resolve unpredictably)
 */
export const resolveRedirectTo = ({ url }: ResolveRedirectToArgs) => {
  const redirectTo = new URL(url).searchParams.get('redirectTo');

  if (redirectTo === null) {
    return DEFAULT_REDIRECT;
  }
  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }

  return redirectTo;
};
