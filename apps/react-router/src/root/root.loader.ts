import { INITIAL_GLOBAL_SETTINGS } from '@/contexts/GlobalSettingsContext/GlobalSettingsContext.constants';
import { getRequestCspNonce } from '@/utils/security';
import { getThemeFromCookie } from '@/utils/theme';
import { getGlobalSettingsFromCookie } from '@/utils/globalSettings';

import type { Route } from '../+types/root';

/**
 * Loader to get theme and global settings from cookies for SSR hydration.
 */
export const loader = ({ request }: Route.LoaderArgs) => {
  const cspNonce = getRequestCspNonce(request);
  const cookieHeader = request.headers.get('Cookie');
  const globalSettings = getGlobalSettingsFromCookie({
    cookieString: cookieHeader ?? undefined,
    fallback: INITIAL_GLOBAL_SETTINGS,
  });
  const theme = getThemeFromCookie(cookieHeader);

  return { cspNonce, globalSettings, theme };
};
