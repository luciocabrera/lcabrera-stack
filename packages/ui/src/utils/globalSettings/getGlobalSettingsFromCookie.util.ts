import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { GlobalSettingsState } from '#ui/types/globalSettings.types';

import { logger } from '#ui/utils/logger';
import { getAppScopedCookieKey } from '#ui/utils/storage';
import { readFromCookie } from '#ui/utils/storage/readFromCookie.util';

import {
  GLOBAL_SETTINGS_COOKIE_KEY,
  GLOBAL_SETTINGS_COOKIE_VERSION,
} from './globalSettings.constants';
import { toGlobalGroupingPreferences } from './toGlobalGroupingPreferences.util';
import { toGlobalNavigationPreferences } from './toGlobalNavigationPreferences.util';
import { toGlobalPinningPreferences } from './toGlobalPinningPreferences.util';

type GetGlobalSettingsFromCookieArgs = {
  readonly appId?: string;
  readonly cookieString?: string;
  readonly fallback: GlobalSettingsState;
};

type GlobalSettingsCookiePayload = {
  readonly value?: unknown;
  readonly version?: unknown;
};

export const getGlobalSettingsFromCookie = ({
  appId,
  cookieString,
  fallback,
}: GetGlobalSettingsFromCookieArgs) => {
  const rawCookie = readFromCookie({
    cookieString,
    key: getAppScopedCookieKey({ appId, key: GLOBAL_SETTINGS_COOKIE_KEY }),
  });

  if (!rawCookie) {
    return fallback;
  }

  try {
    const payload = JSON.parse(
      decodeURIComponent(rawCookie),
    ) as GlobalSettingsCookiePayload;

    if (payload.version !== GLOBAL_SETTINGS_COOKIE_VERSION) {
      return fallback;
    }

    if (!isObject(payload.value)) {
      return fallback;
    }

    const parsedPinning = toGlobalPinningPreferences(payload.value.pinning);
    const parsedNavigation = toGlobalNavigationPreferences(
      payload.value.navigation,
    );
    const parsedGrouping = toGlobalGroupingPreferences(payload.value.grouping);

    return {
      grouping: parsedGrouping ?? fallback.grouping,
      navigation: parsedNavigation ?? fallback.navigation,
      pinning: parsedPinning ?? fallback.pinning,
    };
  } catch (error) {
    logger.debug('[globalSettings] Failed to parse settings cookie:', error);
    return fallback;
  }
};
