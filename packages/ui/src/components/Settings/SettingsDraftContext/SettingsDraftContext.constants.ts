import type { SettingsDraft } from '../Settings.types';

import { toDraft } from '../utils';

/** All-defaults draft used as the store snapshot fallback. */
export const DEFAULT_SETTINGS_DRAFT: SettingsDraft = toDraft({
  navigationPreferences: {},
  pinningPreferences: {},
});
