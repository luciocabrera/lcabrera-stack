import { GLOBAL_SETTINGS_COOKIE_VERSION } from './globalSettings.constants';

import type { GlobalSettingsState } from '@/types/globalSettings.types';

type SerializeGlobalSettingsForCookieArgs = {
  readonly settings: GlobalSettingsState;
};

export const serializeGlobalSettingsForCookie = ({
  settings,
}: SerializeGlobalSettingsForCookieArgs): string => {
  return JSON.stringify({
    value: settings,
    version: GLOBAL_SETTINGS_COOKIE_VERSION,
  });
};
