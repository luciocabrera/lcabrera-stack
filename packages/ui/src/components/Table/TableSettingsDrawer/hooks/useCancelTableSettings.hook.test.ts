// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  isTableSettingsPinnedMock,
  resetTableDrawerSettingsMock,
  setTableIsTableSettingsOpenMock,
} = vi.hoisted(() => ({
  isTableSettingsPinnedMock: vi.fn(() => false),
  resetTableDrawerSettingsMock: vi.fn(),
  setTableIsTableSettingsOpenMock: vi.fn(),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/actions',
  () => ({
    useSetTableIsTableSettingsOpen: () => setTableIsTableSettingsOpenMock,
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableIsTableSettingsPinned: () => isTableSettingsPinnedMock(),
  }),
);

vi.mock('../TableDrawerContext/actions', () => ({
  useResetTableSettings: () => resetTableDrawerSettingsMock,
}));

import { useCancelTableSettings } from './useCancelTableSettings.hook';

beforeEach(() => {
  isTableSettingsPinnedMock.mockReset();
  isTableSettingsPinnedMock.mockReturnValue(false);
  resetTableDrawerSettingsMock.mockReset();
  setTableIsTableSettingsOpenMock.mockReset();
});

describe('useCancelTableSettings', () => {
  it('resets drawer state and closes the drawer when unpinned', () => {
    const { result } = renderHook(() =>
      useCancelTableSettings({ isBusy: false }),
    );

    act(() => {
      result.current();
    });

    expect(resetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).toHaveBeenCalledWith(false);
  });

  it('resets drawer state and keeps the drawer open when pinned', () => {
    isTableSettingsPinnedMock.mockReturnValue(true);

    const { result } = renderHook(() =>
      useCancelTableSettings({ isBusy: false }),
    );

    act(() => {
      result.current();
    });

    expect(resetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });

  it('does nothing while busy', () => {
    const { result } = renderHook(() =>
      useCancelTableSettings({ isBusy: true }),
    );

    act(() => {
      result.current();
    });

    expect(resetTableDrawerSettingsMock).not.toHaveBeenCalled();
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });
});
