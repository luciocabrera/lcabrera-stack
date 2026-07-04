import { INITIAL_GLOBAL_SETTINGS } from '@repo/ui/contexts/GlobalSettingsContext/GlobalSettingsContext.constants';
import { getGlobalSettingsFromCookie } from '@repo/ui/utils/globalSettings';
import { getRequestCspNonce } from '@repo/ui/utils/security';
import { getThemeFromCookie } from '@repo/ui/utils/theme';

type GetRootLoaderDataArgs = {
  readonly request: Request;
};

/**
 * The root-route loader logic every app needs identically: theme and
 * global settings from cookies (for SSR hydration) plus the CSP nonce, all
 * already-shared reads. Takes the web-standard Request rather than an
 * app's generated Route.LoaderArgs type — root has no dynamic params, so
 * nothing is lost, and this stays usable from any app's root loader.
 */
export const getRootLoaderData = ({ request }: GetRootLoaderDataArgs) => {
  const cspNonce = getRequestCspNonce(request);
  const cookieHeader = request.headers.get('Cookie');
  const globalSettings = getGlobalSettingsFromCookie({
    cookieString: cookieHeader ?? undefined,
    fallback: INITIAL_GLOBAL_SETTINGS,
  });
  const theme = getThemeFromCookie(cookieHeader);

  return { cspNonce, globalSettings, theme };
};
