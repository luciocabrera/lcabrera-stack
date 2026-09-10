// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

const { metaStoreGetMock, metaStoreSetMock, persistUiFlagsMock } = vi.hoisted(
  () => ({
    metaStoreGetMock: vi.fn(() => ({
      persistenceKey: 'orders',
      settingsPanelWidth: 640,
    })),
    metaStoreSetMock: vi.fn(),
    persistUiFlagsMock: vi.fn(),
  }),
);

vi.mock('../../useTableConfigContextValue.hook', () => ({
  useTableConfigContextValue: () => ({
    metaStore: {
      get: metaStoreGetMock,
      set: metaStoreSetMock,
    },
  }),
}));

vi.mock('./usePersistTableUiFlagsAction.hook', () => ({
  usePersistTableUiFlagsAction: () => persistUiFlagsMock,
}));

import { useResetTableSettingsPanelWidth } from './useResetTableSettingsPanelWidth.hook';

describe('useResetTableSettingsPanelWidth', () => {
  it('clears the stored width rather than writing the band floor, so the panel paints from its size', () => {
    const { result } = renderHook(() => useResetTableSettingsPanelWidth());

    act(() => {
      result.current();
    });

    expect(metaStoreSetMock).toHaveBeenCalledWith({
      settingsPanelWidth: undefined,
    });
  });

  it('persists the cleared width, so the panel does not reopen at the old one', () => {
    const { result } = renderHook(() => useResetTableSettingsPanelWidth());

    act(() => {
      result.current();
    });

    expect(persistUiFlagsMock.mock.calls.at(-1)?.[0]).toStrictEqual({
      currentState: { persistenceKey: 'orders', settingsPanelWidth: 640 },
      nextStatePatch: { settingsPanelWidth: undefined },
    });
  });
});
