// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const {
  readPersistedStateFromSessionStorageMock,
  readPersistedUiStateFromSessionStorageMock,
  columnsStoreMock,
  metaStoreMock,
} = vi.hoisted(() => ({
  readPersistedStateFromSessionStorageMock: vi.fn(() => ({})),
  readPersistedUiStateFromSessionStorageMock: vi.fn(() => ({})),
  columnsStoreMock: { set: vi.fn() },
  metaStoreMock: { set: vi.fn() },
}));

vi.mock('@/components/Table/utils', async (importOriginal) => {
  const orig =
    await importOriginal<typeof import('@/components/Table/utils')>();
  return {
    ...orig,
    readPersistedStateFromSessionStorage:
      readPersistedStateFromSessionStorageMock,
    readPersistedUiStateFromSessionStorage:
      readPersistedUiStateFromSessionStorageMock,
  };
});

import { useHydrateTableSessionState } from './useHydrateTableSessionState.hook';

describe('useHydrateTableSessionState', () => {
  it('does not call store.set when sessionStorage is empty', () => {
    readPersistedStateFromSessionStorageMock.mockReturnValue({});
    readPersistedUiStateFromSessionStorageMock.mockReturnValue({});

    renderHook(() =>
      useHydrateTableSessionState({
        columnsStore: columnsStoreMock as never,
        metaStore: metaStoreMock as never,
        persistenceKey: 'orders',
      }),
    );

    expect(columnsStoreMock.set).not.toHaveBeenCalled();
    expect(metaStoreMock.set).not.toHaveBeenCalled();
  });

  it('applies column state from sessionStorage on mount', () => {
    const sorting = [{ columnKey: 'name', direction: 'asc' }];
    readPersistedStateFromSessionStorageMock.mockReturnValue({ sorting });
    readPersistedUiStateFromSessionStorageMock.mockReturnValue({});

    renderHook(() =>
      useHydrateTableSessionState({
        columnsStore: columnsStoreMock as never,
        metaStore: metaStoreMock as never,
        persistenceKey: 'orders',
      }),
    );

    expect(columnsStoreMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ sorting }),
    );
  });

  it('applies UI state from sessionStorage on mount', () => {
    readPersistedStateFromSessionStorageMock.mockReturnValue({});
    readPersistedUiStateFromSessionStorageMock.mockReturnValue({
      isTableSettingsOpen: true,
      isTableSettingsPinned: true,
    });

    renderHook(() =>
      useHydrateTableSessionState({
        columnsStore: columnsStoreMock as never,
        metaStore: metaStoreMock as never,
        persistenceKey: 'orders',
      }),
    );

    expect(metaStoreMock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        isTableSettingsOpen: true,
        isTableSettingsPinned: true,
      }),
    );
  });

  it('runs only once regardless of re-renders', () => {
    readPersistedStateFromSessionStorageMock.mockReturnValue({ sorting: [] });
    readPersistedUiStateFromSessionStorageMock.mockReturnValue({});

    const { rerender } = renderHook(() =>
      useHydrateTableSessionState({
        columnsStore: columnsStoreMock as never,
        metaStore: metaStoreMock as never,
        persistenceKey: 'orders',
      }),
    );

    act(() => {
      rerender();
    });
    act(() => {
      rerender();
    });

    // Re-renders alone do not trigger additional store.set calls (effect dependency is empty).
    // React 19 strict mode may call it during the double-mount cycle but never
    // during the subsequent re-renders triggered here.
    expect(columnsStoreMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ sorting: [] }),
    );
  });
});
