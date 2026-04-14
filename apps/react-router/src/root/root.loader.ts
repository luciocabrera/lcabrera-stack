import { getThemeFromCookie } from '@/utils/theme';
import { getRequestCspNonce } from '@/utils/security';

import type { Route } from '../+types/root';

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
