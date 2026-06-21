// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPersistedUiStateMock, writePersistedUiStateToSessionStorageMock } =
  vi.hoisted(() => ({
    getPersistedUiStateMock: vi.fn(() => ({ isTableSettingsOpen: true })),
    writePersistedUiStateToSessionStorageMock: vi.fn(),
  }));

vi.mock('@/components/Table/utils', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/components/Table/utils')>();

  return {
    ...actual,
    getPersistedUiState: getPersistedUiStateMock,
    writePersistedUiStateToSessionStorage:
      writePersistedUiStateToSessionStorageMock,
  };
});

import { persistTableMetaUiState } from './persistTableMetaUiState.util';

describe('persistTableMetaUiState', () => {
  beforeEach(() => {
    getPersistedUiStateMock.mockReset();
    getPersistedUiStateMock.mockReturnValue({ isTableSettingsOpen: true });
    writePersistedUiStateToSessionStorageMock.mockReset();
  });

  it('writes the merged next meta UI state to sessionStorage when persistence is enabled', () => {
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
    expect(writePersistedUiStateToSessionStorageMock).toHaveBeenCalledWith({
      persistenceKey: 'orders',
      uiState: { isTableSettingsOpen: true },
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
    expect(writePersistedUiStateToSessionStorageMock).not.toHaveBeenCalled();
  });
});
