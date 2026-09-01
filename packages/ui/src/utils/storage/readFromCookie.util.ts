import { parseCookies } from './parseCookies.util';

type ReadFromCookieArgs = {
  readonly cookieString?: string;
  readonly key: string;
};

export const readFromCookie = ({ cookieString, key }: ReadFromCookieArgs) => {
  if (typeof document !== 'undefined' && !cookieString) {
    const cookies = parseCookies(document.cookie);
    return cookies[key];
  }

  if (cookieString) {
    const cookies = parseCookies(cookieString);
    return cookies[key];
  }
};
