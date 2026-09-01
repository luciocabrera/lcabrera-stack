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
  batchSetTableDrawerSettingsMock,
  isTableSettingsPinnedMock,
  notifyMock,
  resetTableDrawerSettingsMock,
  setTableIsTableSettingsOpenMock,
  tableColumnFiltersMock,
} = vi.hoisted(() => ({
  batchSetTableDrawerSettingsMock: vi.fn(),
  isTableSettingsPinnedMock: vi.fn(() => false),
  notifyMock: vi.fn(),
  resetTableDrawerSettingsMock: vi.fn(),
  setTableIsTableSettingsOpenMock: vi.fn(),
  tableColumnFiltersMock: {} as Record<string, unknown>,
}));

type ButtonProps = {
  readonly children: ReactNode;
  readonly isBusy?: boolean;
  readonly isDisabled?: boolean;
  readonly onClick?: () => void;
};

vi.mock('#ui/components/Button', () => ({
  Button: ({ children, isBusy, isDisabled, onClick }: ButtonProps) => (
    <button disabled={isDisabled || isBusy} onClick={onClick} type='button'>
      {children}
    </button>
  ),
}));

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelFooter: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableIsTableSettingsOpen: () => setTableIsTableSettingsOpenMock,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableIsTableSettingsPinned: () => isTableSettingsPinnedMock(),
}));

vi.mock('#ui/contexts/NotificationContext/actions', () => ({
  useNotifyAction: () => notifyMock,
}));

vi.mock('../TableDrawerContext/actions', () => ({
  useBatchSetTableDrawerSettings: () => batchSetTableDrawerSettingsMock,
  useResetTableSettings: () => resetTableDrawerSettingsMock,
}));

vi.mock('../TableDrawerContext/selectors', () => ({
  useGetColumnFilters: () => tableColumnFiltersMock,
}));

import { TableSettingsDrawerFooter } from './TableSettingsDrawerFooter.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  batchSetTableDrawerSettingsMock.mockReset();
  isTableSettingsPinnedMock.mockReset();
  isTableSettingsPinnedMock.mockReturnValue(false);
  notifyMock.mockReset();
  resetTableDrawerSettingsMock.mockReset();
  setTableIsTableSettingsOpenMock.mockReset();
  for (const key of Object.keys(tableColumnFiltersMock)) {
    delete tableColumnFiltersMock[key];
  }
});

describe('TableSettingsDrawerFooter', () => {
  it('accepts changes and closes the drawer when unpinned', () => {
    render(<TableSettingsDrawerFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(batchSetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).toHaveBeenCalledWith(false);
  });

  it('accepts changes and keeps the drawer open when pinned', () => {
    isTableSettingsPinnedMock.mockReturnValue(true);

    render(<TableSettingsDrawerFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(batchSetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });

  it('shows a notification and blocks accept when filters are invalid', () => {
    tableColumnFiltersMock.order_date = {
      operator: 'equals',
      type: 'date',
      value: '',
    };

    render(<TableSettingsDrawerFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(batchSetTableDrawerSettingsMock).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });

  it('cancels changes, resets drawer state, and closes when unpinned', () => {
    render(<TableSettingsDrawerFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(resetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).toHaveBeenCalledWith(false);
  });

  it('cancels changes, resets drawer state, and keeps open when pinned', () => {
    isTableSettingsPinnedMock.mockReturnValue(true);

    render(<TableSettingsDrawerFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(resetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });

  it('ignores accept and cancel while busy', () => {
    render(<TableSettingsDrawerFooter isBusy />);

    const acceptButton = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Accept',
    });
    const cancelButton = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Cancel',
    });

    expect(acceptButton.disabled).toBe(true);
    expect(cancelButton.disabled).toBe(true);

    fireEvent.click(acceptButton);
    fireEvent.click(cancelButton);

    expect(batchSetTableDrawerSettingsMock).not.toHaveBeenCalled();
    expect(resetTableDrawerSettingsMock).not.toHaveBeenCalled();
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });

  it('leaves both actions enabled when idle', () => {
    render(<TableSettingsDrawerFooter />);

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
