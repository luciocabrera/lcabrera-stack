// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  batchSetColumnDrawerSettingsMock,
  isColumnSettingsPinnedMock,
  resetAllColumnDrawerSettingsMock,
} = vi.hoisted(() => ({
  batchSetColumnDrawerSettingsMock: vi.fn(),
  isColumnSettingsPinnedMock: vi.fn(() => false),
  resetAllColumnDrawerSettingsMock: vi.fn(),
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
    render(<ColumnSettingsDrawerFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(batchSetColumnDrawerSettingsMock).not.toHaveBeenCalled();
    expect(resetAllColumnDrawerSettingsMock).not.toHaveBeenCalled();
  });
});
