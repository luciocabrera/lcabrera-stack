import { INITIAL_GLOBAL_SETTINGS } from '#ui/contexts/GlobalSettingsContext/GlobalSettingsContext.constants';
import { getGlobalSettingsFromCookie } from '#ui/utils/globalSettings';
import { getRequestCspNonce } from '#ui/utils/security';
import { getThemeFromCookie } from '#ui/utils/theme';

type GetRootLoaderDataArgs = {
  readonly appId?: string;
  readonly request: Request;
};

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
