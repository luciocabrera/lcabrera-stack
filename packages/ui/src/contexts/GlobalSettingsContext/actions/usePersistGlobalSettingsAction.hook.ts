import type { GlobalSettingsState } from '@lcabrera/ui/types/globalSettings.types';

import { usePersistCookieAction } from '@lcabrera/ui/hooks/usePersistCookieAction.hook';
import { buildPersistCookieEntry } from '@lcabrera/ui/routing/actions/buildPersistCookieEntry.util';
import {
  GLOBAL_SETTINGS_COOKIE_KEY,
  serializeGlobalSettingsForCookie,
} from '@lcabrera/ui/utils/globalSettings';
import { getAppScopedCookieKey } from '@lcabrera/ui/utils/storage';

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
