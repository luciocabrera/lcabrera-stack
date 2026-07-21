import type { GlobalSettingsState } from '@lcabrera/ui/types/globalSettings.types';

import { GLOBAL_SETTINGS_COOKIE_VERSION } from './globalSettings.constants';

type SerializeGlobalSettingsForCookieArgs = {
  readonly settings: GlobalSettingsState;
};

export const serializeGlobalSettingsForCookie = ({
  settings,
}: SerializeGlobalSettingsForCookieArgs) => {
  return JSON.stringify({
    value: settings,
    version: GLOBAL_SETTINGS_COOKIE_VERSION,
  });
};
