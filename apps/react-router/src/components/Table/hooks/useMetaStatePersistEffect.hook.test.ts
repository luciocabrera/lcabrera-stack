// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const {
  writePersistedUiStateToSessionStorageMock,
  metaStoreSubscribeMock,
  metaStoreGetMock,
} = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    writePersistedUiStateToSessionStorageMock: vi.fn(),
    metaStoreGetMock: vi.fn(() => ({
      isTableSettingsOpen: false,
      isTableSettingsPinned: false,
      isColumnSettingsOpen: false,
      isColumnSettingsPinned: false,
      tableSettingsSelectedTab: 'general',
      tableSettingsExpandedFilters: [],
    })),
    metaStoreSubscribeMock: vi.fn((cb: () => void) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    }),
    triggerSubscribers: () => {
      for (const cb of listeners) cb();
    },
  };
});

vi.mock('@/components/Table/utils', async (importOriginal) => {
  const orig =
    await importOriginal<typeof import('@/components/Table/utils')>();
  return {
    ...orig,
    writePersistedUiStateToSessionStorage:
      writePersistedUiStateToSessionStorageMock,
  };
});

import { useMetaStatePersistEffect } from './useMetaStatePersistEffect.hook';

const metaStoreMock = {
  get: metaStoreGetMock,
  subscribe: metaStoreSubscribeMock,
};

describe('useMetaStatePersistEffect', () => {
  it('writes UI state to sessionStorage immediately on mount', () => {
    renderHook(() =>
      useMetaStatePersistEffect({
        metaStore: metaStoreMock as never,
        persistenceKey: 'orders',
      }),
    );

    expect(writePersistedUiStateToSessionStorageMock).toHaveBeenCalledWith(
      expect.objectContaining({ persistenceKey: 'orders' }),
    );
  });

  it('subscribes to metaStore changes', () => {
    renderHook(() =>
      useMetaStatePersistEffect({
        metaStore: metaStoreMock as never,
        persistenceKey: 'orders',
      }),
    );

    // React 19 strict mode may mount twice; at minimum one subscription must exist.
    expect(metaStoreSubscribeMock).toHaveBeenCalled();
  });

  it('persists only the meta UI fields, not all meta state', () => {
    renderHook(() =>
      useMetaStatePersistEffect({
        metaStore: metaStoreMock as never,
        persistenceKey: 'orders',
      }),
    );

    const call = writePersistedUiStateToSessionStorageMock.mock.calls[0];
    const { uiState } = (call?.[0] ?? {}) as {
      uiState: Record<string, unknown>;
    };

    expect(Object.keys(uiState).sort()).toEqual([
      'isColumnSettingsOpen',
      'isColumnSettingsPinned',
      'isTableSettingsOpen',
      'isTableSettingsPinned',
      'tableSettingsExpandedFilters',
      'tableSettingsSelectedTab',
    ]);
  });
});
