import type { GlobalSettingsState } from '@lcabrera/ui/types/globalSettings.types';

import { logger } from '@lcabrera/ui/utils/logger';
import { getAppScopedCookieKey } from '@lcabrera/ui/utils/storage';
import { readFromCookie } from '@lcabrera/ui/utils/storage/readFromCookie.util';
import { isObject } from '@lcabrera/utils/guards/is-object.util';

import {
  GLOBAL_SETTINGS_COOKIE_KEY,
  GLOBAL_SETTINGS_COOKIE_VERSION,
} from './globalSettings.constants';
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

/**
 * Read global settings (pinning + navigation preferences) from the settings
 * cookie (SSR-safe via optional cookie string).
 *
 * Returns the fallback when the cookie is missing, malformed, or has a stale
 * version; each preference slice falls back independently when invalid.
 * @param args - Optional raw `Cookie` header string and the fallback state.
 * @returns The parsed global settings state, or the fallback.
 */
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

    return {
      navigation: parsedNavigation ?? fallback.navigation,
      pinning: parsedPinning ?? fallback.pinning,
    };
  } catch (error) {
    logger.debug('[globalSettings] Failed to parse settings cookie:', error);
    return fallback;
  }
};
