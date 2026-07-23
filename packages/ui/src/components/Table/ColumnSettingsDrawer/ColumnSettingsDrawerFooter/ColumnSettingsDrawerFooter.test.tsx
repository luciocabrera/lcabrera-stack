// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

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
  readonly isBusy?: boolean;
  readonly isDisabled?: boolean;
  readonly onClick?: () => void;
};

vi.mock('@lcabrera/ui/components/Button', () => ({
  // Mirrors the real Button, which renders disabled={isDisabled || isBusy}.
  // A stub that drops them silently makes disabled-state assertions vacuous.
  Button: ({ children, isBusy, isDisabled, onClick }: ButtonProps) => (
    <button disabled={isDisabled || isBusy} onClick={onClick} type='button'>
      {children}
    </button>
  ),
}));

vi.mock('@lcabrera/ui/components/SidePanel', () => ({
  SidePanelFooter: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableIsColumnSettingsPinned: () => isColumnSettingsPinnedMock(),
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableData/data/selectors',
  () => ({
    useGetTableIsLoading: () => useGetTableIsLoadingMock(),
    useGetTableIsLoadingMore: () => useGetTableIsLoadingMoreMock(),
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

    const acceptButton = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Accept',
    });
    const cancelButton = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Cancel',
    });

    // Both halves of the guard: the buttons are disabled, and the handlers
    // bail on isBusy even if something did dispatch a click past that.
    expect(acceptButton.disabled).toBe(true);
    expect(cancelButton.disabled).toBe(true);

    fireEvent.click(acceptButton);
    fireEvent.click(cancelButton);

    expect(batchSetColumnDrawerSettingsMock).not.toHaveBeenCalled();
    expect(resetAllColumnDrawerSettingsMock).not.toHaveBeenCalled();
  });

  it('disables both actions while a load-more is in flight', () => {
    useGetTableIsLoadingMoreMock.mockReturnValue(true);
    render(<ColumnSettingsDrawerFooter />);

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Accept' })
        .disabled,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Cancel' })
        .disabled,
    ).toBe(true);
  });

  it('leaves both actions enabled when idle', () => {
    render(<ColumnSettingsDrawerFooter />);

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Accept' })
        .disabled,
    ).toBe(false);
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Cancel' })
        .disabled,
    ).toBe(false);
  });
});
