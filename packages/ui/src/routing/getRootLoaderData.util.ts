import { INITIAL_GLOBAL_SETTINGS } from '@repo/ui/contexts/GlobalSettingsContext/GlobalSettingsContext.constants';
import { getGlobalSettingsFromCookie } from '@repo/ui/utils/globalSettings';
import { getRequestCspNonce } from '@repo/ui/utils/security';
import { getThemeFromCookie } from '@repo/ui/utils/theme';

type GetRootLoaderDataArgs = {
  /**
   * Per-application identifier used to scope the theme / global-settings
   * cookies. Cookies are shared across ports on the same host, so each app must
   * pass its own id to keep preferences isolated.
   */
  readonly appId?: string;
  readonly request: Request;
};

/**
 * The root-route loader logic every app needs identically: theme and
 * global settings from cookies (for SSR hydration) plus the CSP nonce, all
 * already-shared reads. Takes the web-standard Request rather than an
 * app's generated Route.LoaderArgs type — root has no dynamic params, so
 * nothing is lost, and this stays usable from any app's root loader.
 */
export const getRootLoaderData = ({
  appId,
  request,
}: GetRootLoaderDataArgs) => {
  const cspNonce = getRequestCspNonce(request);
  const cookieHeader = request.headers.get('Cookie');
  const globalSettings = getGlobalSettingsFromCookie({
    appId,
    cookieString: cookieHeader ?? undefined,
    fallback: INITIAL_GLOBAL_SETTINGS,
  });
  const theme = getThemeFromCookie({
    appId,
    cookieHeader: cookieHeader ?? undefined,
  });

  return { cspNonce, globalSettings, theme };
};
