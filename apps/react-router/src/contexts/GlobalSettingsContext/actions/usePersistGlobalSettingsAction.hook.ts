import { useFetcher, useLocation } from 'react-router';

import {
  GLOBAL_SETTINGS_COOKIE_KEY,
  serializeGlobalSettingsForCookie,
} from '@/utils/globalSettings';

import type { GlobalSettingsState } from '@/types/globalSettings.types';
import { PERSIST_COOKIE_ACTION } from '@/constants/globalSettings.constants';

export const usePersistGlobalSettingsAction = () => {
  const fetcher = useFetcher({ key: 'persist-global-settings' });
  const location = useLocation();

  return (settings: GlobalSettingsState): void => {
    const currentUrl = `${location.pathname}${location.search}`;
    const serializedSettings = serializeGlobalSettingsForCookie({ settings });

    void fetcher.submit(
      {
        currentUrl,
        entries: JSON.stringify([
          {
            key: GLOBAL_SETTINGS_COOKIE_KEY,
            searchParamKey: '',
            searchParamValue: '',
            value: serializedSettings,
          },
        ]),
      },
      { action: PERSIST_COOKIE_ACTION, method: 'POST' },
    );
  };
};
