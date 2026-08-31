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

const resolveFromRequestUrl = (requestUrl: string): string | undefined => {
  try {
    const { hostname, protocol } = new URL(requestUrl);

    return isLocalIp(hostname)
      ? CONFIG.localhost.apiHost
      : `${protocol}//${hostname}/api`;
  } catch {
    return undefined;
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
