// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { PERSISTENCE_VERSION } from './persistence.constants';

const { readFromSessionStorageMock } = vi.hoisted(() => ({
  readFromSessionStorageMock: vi.fn<() => string | undefined>(() => undefined),
}));

vi.mock('@/utils/storage', () => ({
  readFromSessionStorage: readFromSessionStorageMock,
}));

import { readPersistedUiStateFromSessionStorage } from './readPersistedUiStateFromSessionStorage.util';

const makeSlice = (value: unknown) =>
  encodeURIComponent(JSON.stringify({ value, version: PERSISTENCE_VERSION }));

describe('readPersistedUiStateFromSessionStorage', () => {
  it('returns empty object when sessionStorage has nothing', () => {
    readFromSessionStorageMock.mockReturnValue(undefined);
    expect(
      readPersistedUiStateFromSessionStorage({ persistenceKey: 'orders' }),
    ).toEqual({});
  });

  it('reads and returns the stored UI state', () => {
    const uiState = {
      isColumnSettingsOpen: false,
      isColumnSettingsPinned: false,
      isTableSettingsOpen: true,
      isTableSettingsPinned: true,
      tableSettingsExpandedFilters: ['status'],
      tableSettingsSelectedTab: 'filters',
    };
    readFromSessionStorageMock.mockReturnValue(makeSlice(uiState));
    expect(
      readPersistedUiStateFromSessionStorage({ persistenceKey: 'orders' }),
    ).toEqual(uiState);
  });

  it('returns empty object on version mismatch', () => {
    readFromSessionStorageMock.mockReturnValue(
      encodeURIComponent(
        JSON.stringify({ value: { isTableSettingsOpen: true }, version: 99 }),
      ),
    );
    expect(
      readPersistedUiStateFromSessionStorage({ persistenceKey: 'orders' }),
    ).toEqual({});
  });

  it('returns empty object on invalid JSON', () => {
    readFromSessionStorageMock.mockReturnValue('invalid');
    expect(
      readPersistedUiStateFromSessionStorage({ persistenceKey: 'orders' }),
    ).toEqual({});
  });
});
