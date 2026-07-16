// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { PERSISTENCE_VERSION } from './persistence.constants';

const { writeToCookieMock } = vi.hoisted(() => ({
  writeToCookieMock: vi.fn(),
}));

vi.mock('@repo/ui/utils/storage', () => ({
  writeToCookie: writeToCookieMock,
}));

import { writePersistedUiFlagsToCookie } from './writePersistedUiFlagsToCookie.service';

describe('writePersistedUiFlagsToCookie', () => {
  it('writes the serialized flags to a cookie with version', () => {
    const uiFlags = {
      isColumnSettingsOpen: false,
      isColumnSettingsPinned: false,
      isTableSettingsOpen: true,
      isTableSettingsPinned: true,
    };

    writePersistedUiFlagsToCookie({ persistenceKey: 'orders', uiFlags });

    expect(writeToCookieMock).toHaveBeenCalledTimes(1);
    const args = writeToCookieMock.mock.calls[0]?.[0] as
      | undefined
      | { key: string; value: string };
    expect(args?.key).toBe('table-state-orders-uiFlags');

    // Raw JSON, NOT URI-encoded: writeToCookie owns the encoding. Encoding here
    // too stores a double-encoded payload the reader cannot parse.
    expect(args?.value).toBe(
      JSON.stringify({ value: uiFlags, version: PERSISTENCE_VERSION }),
    );
  });

  it('scopes the cookie key with appId when provided', () => {
    writePersistedUiFlagsToCookie({
      appId: 'admin-system',
      persistenceKey: 'orders',
      uiFlags: { isTableSettingsOpen: true },
    });

    const args = writeToCookieMock.mock.calls.at(-1)?.[0] as
      | undefined
      | { key: string };
    expect(args?.key).toBe('table-state-admin-system-orders-uiFlags');
  });
});
