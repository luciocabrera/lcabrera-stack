// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { isColumnSettingsPinnedMock, resetAllColumnDrawerSettingsMock } =
  vi.hoisted(() => ({
    isColumnSettingsPinnedMock: vi.fn(() => false),
    resetAllColumnDrawerSettingsMock: vi.fn(),
  }));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableIsColumnSettingsPinned: () => isColumnSettingsPinnedMock(),
  }),
);

vi.mock('../ColumnDrawerContext/actions', () => ({
  useResetAllColumnDrawerSettings: () => resetAllColumnDrawerSettingsMock,
}));

import { useCancelColumnSettings } from './useCancelColumnSettings.hook';

beforeEach(() => {
  isColumnSettingsPinnedMock.mockReset();
  isColumnSettingsPinnedMock.mockReturnValue(false);
  resetAllColumnDrawerSettingsMock.mockReset();
});

describe('useCancelColumnSettings', () => {
  it('resets drawer state and requests close when unpinned', () => {
    const { result } = renderHook(() =>
      useCancelColumnSettings({ isBusy: false }),
    );

    act(() => {
      result.current();
    });

    expect(resetAllColumnDrawerSettingsMock).toHaveBeenCalledWith(true);
  });

  it('resets drawer state without closing when pinned', () => {
    isColumnSettingsPinnedMock.mockReturnValue(true);

    const { result } = renderHook(() =>
      useCancelColumnSettings({ isBusy: false }),
    );

    act(() => {
      result.current();
    });

    expect(resetAllColumnDrawerSettingsMock).toHaveBeenCalledWith(false);
  });

  it('does nothing while busy', () => {
    const { result } = renderHook(() =>
      useCancelColumnSettings({ isBusy: true }),
    );

    act(() => {
      result.current();
    });

    expect(resetAllColumnDrawerSettingsMock).not.toHaveBeenCalled();
  });
});
