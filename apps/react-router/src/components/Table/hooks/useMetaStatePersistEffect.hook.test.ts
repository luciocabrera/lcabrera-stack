// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  metaStoreGetMock,
  metaStoreSubscribeMock,
  resetSubscribers,
  setMetaState,
  triggerLatestSubscriber,
  writePersistedUiStateToSessionStorageMock,
} = vi.hoisted(() => {
  let metaState = {
    drawersSyncNonce: 0,
    isColumnSettingsOpen: false,
    isColumnSettingsPinned: false,
    isTableSettingsOpen: false,
    isTableSettingsPinned: false,
    tableSettingsExpandedFilters: [] as readonly string[],
    tableSettingsSelectedTab: 'general',
  };

  const listeners = new Set<() => void>();
  return {
    metaStoreGetMock: vi.fn(() => metaState),
    metaStoreSubscribeMock: vi.fn((cb: () => void) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    }),
    resetSubscribers: () => {
      listeners.clear();
    },
    setMetaState: (nextState: typeof metaState) => {
      metaState = nextState;
    },
    triggerLatestSubscriber: () => {
      const latest = Array.from(listeners).at(-1);
      latest?.();
    },
    writePersistedUiStateToSessionStorageMock: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks();
  resetSubscribers();
  setMetaState({
    drawersSyncNonce: 0,
    isColumnSettingsOpen: false,
    isColumnSettingsPinned: false,
    isTableSettingsOpen: false,
    isTableSettingsPinned: false,
    tableSettingsExpandedFilters: [],
    tableSettingsSelectedTab: 'general',
  });
});

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

  it('does nothing when the persistence key is empty', () => {
    renderHook(() =>
      useMetaStatePersistEffect({
        metaStore: metaStoreMock as never,
        persistenceKey: '',
      }),
    );

    expect(writePersistedUiStateToSessionStorageMock).not.toHaveBeenCalled();
    expect(metaStoreSubscribeMock).not.toHaveBeenCalled();
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
      'columnSettingsSelectedTab',
      'isColumnSettingsOpen',
      'isColumnSettingsPinned',
      'isTableSettingsOpen',
      'isTableSettingsPinned',
      'tableSettingsExpandedFilters',
      'tableSettingsSelectedTab',
    ]);
  });

  it('skips persistence writes when only non-persisted meta fields change', () => {
    renderHook(() =>
      useMetaStatePersistEffect({
        metaStore: metaStoreMock as never,
        persistenceKey: 'orders',
      }),
    );

    writePersistedUiStateToSessionStorageMock.mockClear();

    setMetaState({
      drawersSyncNonce: 1,
      isColumnSettingsOpen: false,
      isColumnSettingsPinned: false,
      isTableSettingsOpen: false,
      isTableSettingsPinned: false,
      tableSettingsExpandedFilters: [],
      tableSettingsSelectedTab: 'general',
    });
    triggerLatestSubscriber();

    expect(writePersistedUiStateToSessionStorageMock).not.toHaveBeenCalled();
  });

  it('writes when persisted UI fields change', () => {
    renderHook(() =>
      useMetaStatePersistEffect({
        metaStore: metaStoreMock as never,
        persistenceKey: 'orders',
      }),
    );

    writePersistedUiStateToSessionStorageMock.mockClear();

    setMetaState({
      drawersSyncNonce: 1,
      isColumnSettingsOpen: false,
      isColumnSettingsPinned: false,
      isTableSettingsOpen: true,
      isTableSettingsPinned: false,
      tableSettingsExpandedFilters: [],
      tableSettingsSelectedTab: 'general',
    });
    triggerLatestSubscriber();

    expect(writePersistedUiStateToSessionStorageMock).toHaveBeenCalledTimes(1);
  });
});
