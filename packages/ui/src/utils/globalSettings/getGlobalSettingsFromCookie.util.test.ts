import type { GlobalSettingsState } from '@lcabrera/ui/types/globalSettings.types';

import { describe, expect, it } from 'vitest';

import { getGlobalSettingsFromCookie } from './getGlobalSettingsFromCookie.util';
import {
  GLOBAL_SETTINGS_COOKIE_KEY,
  GLOBAL_SETTINGS_COOKIE_VERSION,
} from './globalSettings.constants';

const fallbackSettings: GlobalSettingsState = {
  navigation: {},
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
        navigation: {
          size: 'large',
        },
        pinning: {
          orderConflictResolution: 'pin-to-match-order',
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
      navigation: {
        size: 'large',
      },
      pinning: {
        orderConflictResolution: 'pin-to-match-order',
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

  it('returns fallback when the cookie value is not an object', () => {
    const cookieString = buildCookieString({
      value: 'not-an-object',
      version: GLOBAL_SETTINGS_COOKIE_VERSION,
    });

    expect(
      getGlobalSettingsFromCookie({ cookieString, fallback: fallbackSettings }),
    ).toEqual(fallbackSettings);
  });

  it('returns fallback when the cookie payload is malformed JSON', () => {
    // A raw cookie value that is not valid JSON drives the catch branch.
    const cookieString = `${GLOBAL_SETTINGS_COOKIE_KEY}=${encodeURIComponent('{not valid json')}`;

    expect(
      getGlobalSettingsFromCookie({ cookieString, fallback: fallbackSettings }),
    ).toEqual(fallbackSettings);
  });

  it('scopes the cookie key by appId when one is provided', () => {
    const cookieString = buildCookieString({
      value: { navigation: { size: 'large' } },
      version: GLOBAL_SETTINGS_COOKIE_VERSION,
    });

    // The default (unscoped) key is absent once an appId scopes the lookup.
    expect(
      getGlobalSettingsFromCookie({
        appId: 'admin',
        cookieString,
        fallback: fallbackSettings,
      }),
    ).toEqual(fallbackSettings);
  });

  it('filters invalid pinning preference values', () => {
    const cookieString = buildCookieString({
      value: {
        navigation: {
          size: 'huge',
        },
        pinning: {
          orderConflictResolution: 'not-real',
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
      navigation: {
        size: undefined,
      },
      pinning: {
        orderConflictResolution: undefined,
        pinConflictResolution: undefined,
        pinSide: undefined,
        unpinConflictResolution: undefined,
      },
    });
  });
});
