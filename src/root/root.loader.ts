import { getThemeFromCookie } from '@/utils/theme';

import type { Route } from '../+types/root';

/**
 * Loader to get theme from cookies for SSR hydration
 * This ensures the server renders with the correct theme to avoid hydration mismatch
 */
export const loader = ({ request }: Route.LoaderArgs) => {
  const cookieHeader = request.headers.get('Cookie');
  const theme = getThemeFromCookie(cookieHeader);

  return { theme };
};
