import { afterEach, describe, expect, it, vi } from 'vitest';

import { readPersistedUiFlagsFromCookie } from './readPersistedUiFlagsFromCookie.util';

vi.mock('@repo/ui/utils/storage', () => ({
  readFromCookie: vi.fn(),
}));

import { readFromCookie } from '@repo/ui/utils/storage';

describe('readPersistedUiFlagsFromCookie', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty object when no cookie is found', () => {
    vi.mocked(readFromCookie).mockReturnValue(undefined);
    expect(
      readPersistedUiFlagsFromCookie({ persistenceKey: 'orders' }),
    ).toEqual({});
  });

  it('reads and parses the persisted drawer flags', () => {
    const value = JSON.stringify({
      value: { isTableSettingsOpen: true, isTableSettingsPinned: true },
      version: 1,
    });
    vi.mocked(readFromCookie).mockImplementation(({ key }) =>
      key.endsWith('-uiFlags') ? encodeURIComponent(value) : undefined,
    );

    expect(
      readPersistedUiFlagsFromCookie({ persistenceKey: 'orders' }),
    ).toEqual({
      isTableSettingsOpen: true,
      isTableSettingsPinned: true,
    });
  });

  it('scopes the cookie key with appId when provided', () => {
    vi.mocked(readFromCookie).mockReturnValue(undefined);
    readPersistedUiFlagsFromCookie({
      appId: 'admin-system',
      persistenceKey: 'orders',
    });

    expect(vi.mocked(readFromCookie)).toHaveBeenCalledWith({
      cookieString: undefined,
      key: 'table-state-admin-system-orders-uiFlags',
    });
  });

  it('returns empty object when the version does not match', () => {
    const value = JSON.stringify({
      value: { isTableSettingsOpen: true },
      version: 99,
    });
    vi.mocked(readFromCookie).mockReturnValue(encodeURIComponent(value));

    expect(
      readPersistedUiFlagsFromCookie({ persistenceKey: 'orders' }),
    ).toEqual({});
  });

  it('returns empty object on invalid JSON', () => {
    vi.mocked(readFromCookie).mockReturnValue('%7Bnot-json');

    expect(
      readPersistedUiFlagsFromCookie({ persistenceKey: 'orders' }),
    ).toEqual({});
  });
});
