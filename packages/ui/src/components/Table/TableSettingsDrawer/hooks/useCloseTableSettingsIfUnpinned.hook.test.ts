// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { isTableSettingsPinnedMock, setTableIsTableSettingsOpenMock } =
  vi.hoisted(() => ({
    isTableSettingsPinnedMock: vi.fn(() => false),
    setTableIsTableSettingsOpenMock: vi.fn(),
  }));

vi.mock('@repo/ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableIsTableSettingsOpen: () => setTableIsTableSettingsOpenMock,
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableIsTableSettingsPinned: () => isTableSettingsPinnedMock(),
  }),
);

import { useCloseTableSettingsIfUnpinned } from './useCloseTableSettingsIfUnpinned.hook';

beforeEach(() => {
  isTableSettingsPinnedMock.mockReset();
  isTableSettingsPinnedMock.mockReturnValue(false);
  setTableIsTableSettingsOpenMock.mockReset();
});

describe('useCloseTableSettingsIfUnpinned', () => {
  it('closes the drawer when unpinned', () => {
    const { result } = renderHook(() => useCloseTableSettingsIfUnpinned());

    act(() => {
      result.current();
    });

    expect(setTableIsTableSettingsOpenMock).toHaveBeenCalledWith(false);
  });

  it('keeps the drawer open when pinned', () => {
    isTableSettingsPinnedMock.mockReturnValue(true);

    const { result } = renderHook(() => useCloseTableSettingsIfUnpinned());

    act(() => {
      result.current();
    });

    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });
});
