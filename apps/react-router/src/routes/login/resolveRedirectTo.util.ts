import { DEFAULT_AUTHENTICATED_REDIRECT } from '@/auth/auth.constants';

type ResolveRedirectToArgs = {
  readonly candidate: unknown;
};

/**
 * Validates an untrusted `redirectTo` candidate (from the login URL's query on
 * the loader, or the hidden form field on the action) and returns a safe
 * destination.
 *
 * `redirectTo` is attacker-supplied — anyone can hand out a login link — so an
 * unchecked value would turn login into an open redirect, landing a genuine
 * login on a phisher's page on our own origin. Only **same-origin absolute
 * paths** are honored; everything else falls back to the default:
 *
 * - a non-string (missing field, uploaded file) → default
 * - `//evil.example` — protocol-relative, reads as a path but changes origin
 * - `https://evil.example` — fully qualified
 * - anything not starting with `/` — relative paths resolve unpredictably
 *
 * Pure: a total function of the candidate.
 */
export const resolveRedirectTo = ({ candidate }: ResolveRedirectToArgs) => {
  if (
    typeof candidate !== 'string' ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//')
  ) {
    return DEFAULT_AUTHENTICATED_REDIRECT;
  }

  return candidate;
};
