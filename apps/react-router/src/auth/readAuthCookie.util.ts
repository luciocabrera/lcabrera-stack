import { authCookie } from './authCookie';

type ReadAuthCookieArgs = {
  readonly request: Request;
};

export const readAuthCookie = async ({
  request,
}: ReadAuthCookieArgs): Promise<string | undefined> => {
  const token: unknown = await authCookie.parse(request.headers.get('Cookie'));

  return typeof token === 'string' && token.length > 0 ? token : undefined;
};
