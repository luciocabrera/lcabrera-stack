import { authCookie } from './authCookie';

type ReadAuthCookieArgs = {
  readonly request: Request;
};

/**
 * Reads the raw auth token out of the request's `Cookie` header, or
 * `undefined` when the cookie is absent/empty. This is the effectful edge of
 * the verify path — it touches the request — but it performs no verification;
 * the returned string is handed to `verifyAuthToken`. Deterministic for a
 * given request, so it stays unit testable.
 */
export const readAuthCookie = async ({
  request,
}: ReadAuthCookieArgs): Promise<string | undefined> => {
  const token: unknown = await authCookie.parse(request.headers.get('Cookie'));

  return typeof token === 'string' && token.length > 0 ? token : undefined;
};
