import { describe, expect, it } from 'vitest';

import { getGlobalSettingsFromCookie } from './getGlobalSettingsFromCookie.util';
import {
  GLOBAL_SETTINGS_COOKIE_KEY,
  GLOBAL_SETTINGS_COOKIE_VERSION,
} from './globalSettings.constants';

import type { GlobalSettingsState } from '@/types/globalSettings.types';

const fallbackSettings: GlobalSettingsState = {
  pinning: {},
};

const buildCookieString = (payload: unknown): string => {
  return `${GLOBAL_SETTINGS_COOKIE_KEY}=${encodeURIComponent(JSON.stringify(payload))}`;
};

describe('getGlobalSettingsFromCookie', () => {
  it('returns fallback when cookie is missing', () => {
    expect(
      getGlobalSettingsFromCookie({
        cookieString: 'theme=dark',
        fallback: fallbackSettings,
      }),
    ).toEqual(fallbackSettings);
  });

  it('returns parsed pinning preferences for valid payload', () => {
    const cookieString = buildCookieString({
      value: {
        pinning: {
          pinConflictResolution: 'pin-only',
          pinSide: 'right',
          unpinConflictResolution: 'reorder-to-fill',
        },
      },
      version: GLOBAL_SETTINGS_COOKIE_VERSION,
    });

    expect(
      getGlobalSettingsFromCookie({ cookieString, fallback: fallbackSettings }),
    ).toEqual({
      pinning: {
        pinConflictResolution: 'pin-only',
        pinSide: 'right',
        unpinConflictResolution: 'reorder-to-fill',
      },
    });
  });

  it('returns fallback when payload version does not match', () => {
    const cookieString = buildCookieString({
      value: { pinning: { pinSide: 'left' } },
      version: GLOBAL_SETTINGS_COOKIE_VERSION + 1,
    });

    expect(
      getGlobalSettingsFromCookie({ cookieString, fallback: fallbackSettings }),
    ).toEqual(fallbackSettings);
  });

  it('filters invalid pinning preference values', () => {
    const cookieString = buildCookieString({
      value: {
        pinning: {
          pinConflictResolution: 'invalid',
          pinSide: 'center',
          unpinConflictResolution: 'also-invalid',
        },
      },
      version: GLOBAL_SETTINGS_COOKIE_VERSION,
    });

    expect(
      getGlobalSettingsFromCookie({ cookieString, fallback: fallbackSettings }),
    ).toEqual({
      pinning: {
        pinConflictResolution: undefined,
        pinSide: undefined,
        unpinConflictResolution: undefined,
      },
    });
  });
});
