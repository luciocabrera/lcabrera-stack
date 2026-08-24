import { DEFAULT_AUTHENTICATED_REDIRECT } from '@/auth/auth.constants';

type ResolveRedirectToArgs = {
  readonly candidate: unknown;
};

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
