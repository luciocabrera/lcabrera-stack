// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { metaStore, persistTableMetaUiStateMock } = vi.hoisted(() => ({
  metaStore: {
    get: vi.fn(() => ({
      isTableSettingsOpen: false,
      persistenceKey: 'orders',
      wasTableSettingsOpenBeforeColumnSettings: true,
    })),
    set: vi.fn(),
  },
  persistTableMetaUiStateMock: vi.fn(),
}));

vi.mock('@repo/ui/components/Table/utils', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@repo/ui/components/Table/utils')>();

  return {
    ...actual,
    persistTableMetaUiState: persistTableMetaUiStateMock,
  };
});

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      metaStore,
    }),
  }),
);

import { useCloseColumnSettingsDrawer } from './useCloseColumnSettingsDrawer.hook';

describe('useCloseColumnSettingsDrawer', () => {
  beforeEach(() => {
    metaStore.get.mockReset();
    metaStore.get.mockReturnValue({
      isTableSettingsOpen: false,
      persistenceKey: 'orders',
      wasTableSettingsOpenBeforeColumnSettings: true,
    });
    metaStore.set.mockReset();
    persistTableMetaUiStateMock.mockReset();
  });

  it('persists and applies the closed-drawer meta patch', () => {
    const { result } = renderHook(() => useCloseColumnSettingsDrawer());

    act(() => {
      result.current();
    });

    const expectedPatch = {
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    };

    expect(persistTableMetaUiStateMock).toHaveBeenCalledWith({
      currentState: {
        isTableSettingsOpen: false,
        persistenceKey: 'orders',
        wasTableSettingsOpenBeforeColumnSettings: true,
      },
      nextStatePatch: expectedPatch,
    });
    expect(metaStore.set).toHaveBeenCalledWith(expectedPatch);
  });
});
