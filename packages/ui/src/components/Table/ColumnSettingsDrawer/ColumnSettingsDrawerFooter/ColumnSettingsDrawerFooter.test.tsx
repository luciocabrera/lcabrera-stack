// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  batchSetColumnDrawerSettingsMock,
  isColumnSettingsPinnedMock,
  resetAllColumnDrawerSettingsMock,
  useGetTableIsLoadingMock,
  useGetTableIsLoadingMoreMock,
} = vi.hoisted(() => ({
  batchSetColumnDrawerSettingsMock: vi.fn(),
  isColumnSettingsPinnedMock: vi.fn(() => false),
  resetAllColumnDrawerSettingsMock: vi.fn(),
  useGetTableIsLoadingMock: vi.fn(() => false),
  useGetTableIsLoadingMoreMock: vi.fn(() => false),
}));

type ButtonProps = {
  readonly children: ReactNode;
  readonly onClick?: () => void;
};

vi.mock('@repo/ui/components/Button', () => ({
  Button: ({ children, onClick }: ButtonProps) => (
    <button onClick={onClick} type='button'>
      {children}
    </button>
  ),
}));

vi.mock('@repo/ui/components/SidePanel', () => ({
  SidePanelFooter: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableIsColumnSettingsPinned: () => isColumnSettingsPinnedMock(),
  }),
);

vi.mock('@repo/ui/components/Table/contexts/TableData/data/selectors', () => ({
  useGetTableIsLoading: () => useGetTableIsLoadingMock(),
  useGetTableIsLoadingMore: () => useGetTableIsLoadingMoreMock(),
}));

vi.mock('../ColumnDrawerContext/actions', () => ({
  useBatchSetColumnDrawerSettings: () => batchSetColumnDrawerSettingsMock,
  useResetAllColumnDrawerSettings: () => resetAllColumnDrawerSettingsMock,
}));

import { ColumnSettingsDrawerFooter } from './ColumnSettingsDrawerFooter.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  batchSetColumnDrawerSettingsMock.mockReset();
  isColumnSettingsPinnedMock.mockReset();
  isColumnSettingsPinnedMock.mockReturnValue(false);
  resetAllColumnDrawerSettingsMock.mockReset();
  useGetTableIsLoadingMock.mockReset();
  useGetTableIsLoadingMock.mockReturnValue(false);
  useGetTableIsLoadingMoreMock.mockReset();
  useGetTableIsLoadingMoreMock.mockReturnValue(false);
});

describe('ColumnSettingsDrawerFooter', () => {
  it('accepts changes without closing or resetting the drawer', () => {
    render(<ColumnSettingsDrawerFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(batchSetColumnDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(resetAllColumnDrawerSettingsMock).not.toHaveBeenCalled();
  });

  it('cancels changes and requests close when unpinned', () => {
    render(<ColumnSettingsDrawerFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(resetAllColumnDrawerSettingsMock).toHaveBeenCalledWith(true);
  });

  it('cancels changes without closing when pinned', () => {
    isColumnSettingsPinnedMock.mockReturnValue(true);

    render(<ColumnSettingsDrawerFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(resetAllColumnDrawerSettingsMock).toHaveBeenCalledWith(false);
  });

  it('ignores accept and cancel while busy', () => {
    useGetTableIsLoadingMock.mockReturnValue(true);
    render(<ColumnSettingsDrawerFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(batchSetColumnDrawerSettingsMock).not.toHaveBeenCalled();
    expect(resetAllColumnDrawerSettingsMock).not.toHaveBeenCalled();
  });
});
