/**
 * `globalThis` is narrowed here to a type whose `window` is optional, because
 * that is the truth under SSR while the DOM lib types it as always present.
 * Comparing against the lib type instead is a dead end in both spellings:
 * `=== undefined` reads as unnecessary to
 * `@typescript-eslint/no-unnecessary-condition`, and `typeof … === 'undefined'`
 * trips `unicorn/no-typeof-undefined` — and this is a public package, which may
 * suppress neither. Correcting the type keeps both rules live and covers the
 * property being absent (real Node) as well as present-but-undefined.
 */

import { API_SERVER_PORT, CONFIG } from './config.constants.ts';

const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
];

const isLocalIp = (hostname: string): boolean => {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
};

const resolveFromRequestUrl = (requestUrl: string) => {
  try {
    const { hostname, protocol } = new URL(requestUrl);

    return isLocalIp(hostname)
      ? CONFIG.localhost.apiHost
      : `${protocol}//${hostname}/api`;
  } catch {
    return;
  }
};

export const getApiBaseUrl = (requestUrl?: string): string => {
  const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envApiUrl) {
    return envApiUrl;
  }

  const fromRequestUrl =
    requestUrl === undefined ? undefined : resolveFromRequestUrl(requestUrl);

  if (fromRequestUrl !== undefined) {
    return fromRequestUrl;
  }

  const { window: maybeWindow } = globalThis as { readonly window?: unknown };

  if (maybeWindow === undefined) {
    return CONFIG.localhost.apiHost;
  }

  const { hostname, protocol } = globalThis.location;
  const isDev = import.meta.env.DEV;

  if (isDev) {
    return '/api';
  }

  if (isLocalIp(hostname)) {
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return CONFIG.localhost.apiHost;
    }

    return `${protocol}//${hostname}:${API_SERVER_PORT}/api`;
  }

  return `${protocol}//${hostname}${CONFIG.prod.apiHost}`;
};
