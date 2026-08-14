import { API_SERVER_PORT, CONFIG } from './config.constants.ts';

// Private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x). Module-level so the
// three regexes are compiled once rather than on every getApiBaseUrl call, which
// runs on every service request.
const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
];

/**
 * Check if hostname is a local/private IP address
 */
const isLocalIp = (hostname: string): boolean => {
  // Check for localhost aliases
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
};

/**
 * Get the API base URL based on the current environment.
 *
 * Priority:
 * 1. `VITE_API_URL` — an explicit override, if the app was built with one
 * 2. `requestUrl` — the host being served, when a loader/action supplies one
 * 3. Server-side rendering with neither — the localhost API host
 * 4. Client-side resolution — dev proxy, private IP, or the current origin
 *
 * **`VITE_API_URL` outranking `requestUrl` is a decision, and it reverses the
 * order this function shipped with through `@lcabrera/api@0.2.0`** (#705). The
 * reason is not that explicit configuration ought to beat inference on
 * principle. It is that only *half* a render can supply a `requestUrl`: a
 * loader has one and the browser does not, so ranking it first made a single
 * page resolve two different API hosts depending on which half asked — and
 * resolve them silently, because the SSR half rendered fine against the
 * request's own origin. An override that applies to one half of a render is
 * worse than one that does not apply at all.
 *
 * `requestUrl` keeps the job it actually had, which was never to outrank
 * anything: under SSR there is no `location` to read, so it is the only way a
 * deployed app can learn the origin it is being served from.
 *
 * **To resolve against the request's origin under SSR, do not set
 * `VITE_API_URL` for that build.** Vite substitutes it at build time, so it is
 * a build input rather than a runtime switch: a value present at build wins for
 * every caller in that bundle, and one absent at build cannot be supplied
 * later. An app needing both behaviours from one bundle has to choose between
 * them itself and pass the result as an explicit base URL — no argument to this
 * function will overrule the variable.
 *
 * @param requestUrl - Optional request URL from loader/action (the SSR origin)
 */
export const getApiBaseUrl = (requestUrl?: string): string => {
  // Priority 1: an explicit override outranks every derived source.
  const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Priority 2: a request URL (from loader/action) names the host being served.
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

  // Priority 3: Server-side rendering without either.
  //
  // `globalThis` is narrowed to a type where `window` is optional, because that
  // is the truth under SSR — the DOM lib types it as always present. Comparing
  // against the lib type directly is a dead end in both spellings: `=== undefined`
  // reads as unnecessary to the type checker (@typescript-eslint/no-unnecessary-condition)
  // and `typeof … === 'undefined'` trips unicorn/no-typeof-undefined. Correcting
  // the type instead of silencing the rule keeps both live, and covers the
  // property being absent (real Node) as well as present-but-undefined.
  const { window: maybeWindow } = globalThis as { readonly window?: unknown };

  if (maybeWindow === undefined) {
    return CONFIG.localhost.apiHost;
  }

  // Priority 4: Client-side resolution
  const { hostname, protocol } = globalThis.location;
  const isDev = import.meta.env.DEV;

  // In development, always use the Vite proxy
  if (isDev) {
    return '/api';
  }

  // Check if it's localhost or a private IP
  if (isLocalIp(hostname)) {
    // For localhost aliases, use the configured localhost URL
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return CONFIG.localhost.apiHost;
    }

    // For private IPs, use the same IP but with API server port
    return `${protocol}//${hostname}:${API_SERVER_PORT}/api`;
  }

  // Use appropriate config based on environment
  return `${protocol}//${hostname}${CONFIG.prod.apiHost}`;
};
