import { describe, expect, it } from 'vitest';

import { serializeGlobalSettingsForCookie } from './serializeGlobalSettingsForCookie.util';
import { GLOBAL_SETTINGS_COOKIE_VERSION } from './globalSettings.constants';

describe('serializeGlobalSettingsForCookie', () => {
  it('serializes settings into versioned payload', () => {
    const serialized = serializeGlobalSettingsForCookie({
      settings: {
        navigation: {
          size: 'small',
        },
        pinning: {
          orderConflictResolution: 'remove-conflicting-pins',
          pinConflictResolution: 'pin-only',
          pinSide: 'right',
          unpinConflictResolution: 'unpin-beyond',
        },
      },
    });

    expect(JSON.parse(serialized)).toEqual({
      value: {
        navigation: {
          size: 'small',
        },
        pinning: {
          orderConflictResolution: 'remove-conflicting-pins',
          pinConflictResolution: 'pin-only',
          pinSide: 'right',
          unpinConflictResolution: 'unpin-beyond',
        },
      },
      version: GLOBAL_SETTINGS_COOKIE_VERSION,
    });
  });
});
