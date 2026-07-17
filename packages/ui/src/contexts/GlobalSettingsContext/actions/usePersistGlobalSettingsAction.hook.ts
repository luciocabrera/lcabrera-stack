import type { GlobalSettingsState } from '@repo/ui/types/globalSettings.types';

import { usePersistCookieAction } from '@repo/ui/hooks/usePersistCookieAction.hook';
import { buildPersistCookieEntry } from '@repo/ui/routing/buildPersistCookieEntry.util';
import {
  GLOBAL_SETTINGS_COOKIE_KEY,
  serializeGlobalSettingsForCookie,
} from '@repo/ui/utils/globalSettings';
import { getAppScopedCookieKey } from '@repo/ui/utils/storage';

import { useGlobalSettingsContextValue } from '../useGlobalSettingsContextValue.hook';

export const usePersistGlobalSettingsAction = () => {
  const { appId } = useGlobalSettingsContextValue();
  const persistCookie = usePersistCookieAction({
    fetcherKey: 'persist-global-settings',
  });

  return (settings: GlobalSettingsState) => {
    persistCookie([
      buildPersistCookieEntry({
        key: getAppScopedCookieKey({ appId, key: GLOBAL_SETTINGS_COOKIE_KEY }),
        value: serializeGlobalSettingsForCookie({ settings }),
      }),
    ]);
  };
};
