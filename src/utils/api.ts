import { CONFIG } from '@/constants/api.constants';

/**
 * Check if hostname is a local/private IP address
 */
const isLocalIp = (hostname: string): boolean => {
  // Check for localhost aliases
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  // Check for private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
  const ipPatterns = [/^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./];

  return ipPatterns.some((pattern) => pattern.test(hostname));
};

/**
 * Get the API base URL based on the current environment
 *
 * Priority:
 * 1. Request URL (from loader/action in SSR - highest priority)
 * 2. VITE_API_URL environment variable (if set)
 * 3. Config-based resolution using hostname and environment
 *
 * @param requestUrl - Optional request URL from loader/action (SSR source of truth)
 */
export const getApiBaseUrl = (requestUrl?: string): string => {
  // Priority 1: If we have a request URL (from loader/action), use it to construct the API URL
  if (requestUrl) {
    try {
      const url = new URL(requestUrl);
      const { hostname, protocol } = url;

      // Check if it's localhost or a private IP
      if (isLocalIp(hostname)) {
        return CONFIG.localhost.apiHost;
      }

      // For deployed environments, use same origin with /api path
      return `${protocol}//${hostname}/api`;
    } catch {
      // Invalid URL, fall through to other strategies
    }
  }

  // Priority 2: Check for explicit API URL from environment
  const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Priority 3: Server-side rendering without request URL
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (globalThis.window === undefined) {
    return CONFIG.localhost.apiHost;
  }

  // Priority 4: Client-side resolution
  const { hostname, protocol } = globalThis.location;
  const isDev = import.meta.env.DEV;

  // Check if it's localhost or a private IP
  if (isLocalIp(hostname)) {
    // For localhost aliases, use the configured localhost URL
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return CONFIG.localhost.apiHost;
    }

    // For private IPs, use the same IP but with API port 3001
    return `${protocol}//${hostname}:3001/api`;
  }

  // Use appropriate config based on environment
  return isDev
    ? CONFIG.dev.apiHost
    : `${protocol}//${hostname}${CONFIG.prod.apiHost}`;
};
