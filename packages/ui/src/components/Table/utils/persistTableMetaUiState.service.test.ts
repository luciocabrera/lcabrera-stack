// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPersistedUiStateMock, writePersistedUiFlagsToCookieMock } =
  vi.hoisted(() => ({
    getPersistedUiStateMock: vi.fn(() => ({ isTableSettingsOpen: true })),
    writePersistedUiFlagsToCookieMock: vi.fn(),
  }));

vi.mock('./getPersistedUiState.util', () => ({
  getPersistedUiState: getPersistedUiStateMock,
}));

vi.mock('./writePersistedUiFlagsToCookie.service', () => ({
  writePersistedUiFlagsToCookie: writePersistedUiFlagsToCookieMock,
}));

import { persistTableMetaUiState } from './persistTableMetaUiState.service';

describe('persistTableMetaUiState', () => {
  beforeEach(() => {
    getPersistedUiStateMock.mockReset();
    getPersistedUiStateMock.mockReturnValue({ isTableSettingsOpen: true });
    writePersistedUiFlagsToCookieMock.mockReset();
  });

  it('writes the merged next meta UI state to the cookie when persistence is enabled', () => {
    persistTableMetaUiState({
      currentState: {
        columnOverscan: 2,
        columnSettingsSelectedTab: 'general',
        density: 'compact',
        enablePrefetch: true,
        initialPageSize: 20,
        isBordered: true,
        isColumnSettingsOpen: false,
        isColumnSettingsPinned: false,
        isStriped: true,
        isTableSettingsOpen: false,
        isTableSettingsPinned: false,
        loadMorePageSize: 50,
        overscan: 4,
        persistenceKey: 'orders',
        placeholderRowCount: 8,
        rowHeight: 44,
        tableSettingsExpandedFilters: [],
        tableSettingsSelectedTab: 'general',
        threshold: 200,
      },
      nextStatePatch: {
        isTableSettingsOpen: true,
      },
    });

    expect(getPersistedUiStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isTableSettingsOpen: true,
        persistenceKey: 'orders',
      }),
    );
    // The cookie carries the whole UI state — it is the only channel the loader
    // can read, so anything omitted could not be SSR'd.
    expect(writePersistedUiFlagsToCookieMock).toHaveBeenCalledWith({
      persistenceKey: 'orders',
      uiFlags: { isTableSettingsOpen: true },
    });
  });

  it('does not write when persistenceKey is empty', () => {
    persistTableMetaUiState({
      currentState: undefined,
      nextStatePatch: {
        isTableSettingsOpen: true,
      },
    });

    expect(getPersistedUiStateMock).not.toHaveBeenCalled();
    expect(writePersistedUiFlagsToCookieMock).not.toHaveBeenCalled();
  });
});
