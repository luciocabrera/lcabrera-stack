import { getThemeFromCookie } from '@/utils/theme';
import { getRequestCspNonce } from '@/utils/security';

import type { Route } from '../+types/root';

const CSP_NONCE_HEADER_NAMES = ['x-csp-nonce', 'csp-nonce'] as const;

const getRequestCspNonce = (request: Request): string | undefined => {
  for (const headerName of CSP_NONCE_HEADER_NAMES) {
    const value = request.headers.get(headerName);
    if (value) {
      return value;
    }
  }

  return undefined;
};

/**
 * Loader to get theme from cookies for SSR hydration
 * This ensures the server renders with the correct theme to avoid hydration mismatch
 */
export const loader = ({ request }: Route.LoaderArgs) => {
  const cspNonce = getRequestCspNonce(request);
  const cookieHeader = request.headers.get('Cookie');
  const theme = getThemeFromCookie(cookieHeader);

  return { cspNonce, theme };
};
