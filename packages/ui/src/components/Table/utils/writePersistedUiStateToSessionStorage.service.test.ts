// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { PERSISTENCE_VERSION } from './persistence.constants';

const { writeToSessionStorageMock } = vi.hoisted(() => ({
  writeToSessionStorageMock: vi.fn(),
}));

vi.mock('@repo/ui/utils/storage', () => ({
  writeToSessionStorage: writeToSessionStorageMock,
}));

import { writePersistedUiStateToSessionStorage } from './writePersistedUiStateToSessionStorage.service';

describe('writePersistedUiStateToSessionStorage', () => {
  it('writes the serialized UI state to sessionStorage with version', () => {
    const uiState = {
      isTableSettingsOpen: true,
      isTableSettingsPinned: true,
      tableSettingsSelectedTab: 'filters',
    };

    writePersistedUiStateToSessionStorage({
      persistenceKey: 'orders',
      uiState,
    });

    expect(writeToSessionStorageMock).toHaveBeenCalledTimes(1);
    const call = writeToSessionStorageMock.mock.calls[0];
    const args = call?.[0] as undefined | { key: string; value: string };
    expect(args?.key).toBe('table-state-orders-uiState');

    const decoded = JSON.parse(decodeURIComponent(args?.value ?? '')) as {
      value: unknown;
      version: number;
    };
    expect(decoded.version).toBe(PERSISTENCE_VERSION);
    expect(decoded.value).toEqual(uiState);
  });
});
