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

const { clearAllSettingsMock, resetAllSettingsMock } = vi.hoisted(() => ({
  clearAllSettingsMock: vi.fn(),
  resetAllSettingsMock: vi.fn(),
}));

type ButtonProps = {
  readonly children: ReactNode;
  readonly isBusy?: boolean;
  readonly isDisabled?: boolean;
  readonly onClick?: () => void;
};

vi.mock('#ui/components/Button', () => ({
  // Mirrors the real Button, which renders disabled={isDisabled || isBusy}.
  // A stub that drops them silently makes disabled-state assertions vacuous.
  Button: ({ children, isBusy, isDisabled, onClick }: ButtonProps) => (
    <button disabled={isDisabled || isBusy} onClick={onClick} type='button'>
      {children}
    </button>
  ),
}));

vi.mock('#ui/components/Icons', () => ({
  EraserIcon: () => <span>Eraser icon</span>,
  RefreshIcon: () => <span>Refresh icon</span>,
}));

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelSection: ({ children }: { readonly children: ReactNode }) => (
    <section>{children}</section>
  ),
  SidePanelSectionHeader: ({ title }: { readonly title: string }) => (
    <h3>{title}</h3>
  ),
}));

vi.mock('../../ColumnDrawerContext/actions', () => ({
  useClearAllColumnDrawerSettings: () => clearAllSettingsMock,
  useResetAllColumnDrawerSettings: () => resetAllSettingsMock,
}));

import { GeneralSectionFooter } from './GeneralSectionFooter.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  clearAllSettingsMock.mockReset();
  resetAllSettingsMock.mockReset();
});

describe('GeneralSectionFooter', () => {
  it('renders the section header', () => {
    render(<GeneralSectionFooter />);

    expect(
      screen.getByRole('heading', { name: 'All Settings' }),
    ).not.toBeNull();
  });

  it('clears all settings through the drawer action', () => {
    render(<GeneralSectionFooter />);

    fireEvent.click(screen.getByRole('button', { name: /Clear All Settings/ }));

    expect(clearAllSettingsMock).toHaveBeenCalledTimes(1);
    expect(resetAllSettingsMock).not.toHaveBeenCalled();
  });

  it('resets all settings through the drawer action', () => {
    render(<GeneralSectionFooter />);

    fireEvent.click(screen.getByRole('button', { name: /Reset All Settings/ }));

    expect(resetAllSettingsMock).toHaveBeenCalledTimes(1);
    expect(clearAllSettingsMock).not.toHaveBeenCalled();
  });

  it('disables both actions while busy, so neither fires', () => {
    render(<GeneralSectionFooter isBusy />);

    const clearButton = screen.getByRole<HTMLButtonElement>('button', {
      name: /Clear All Settings/,
    });
    const resetButton = screen.getByRole<HTMLButtonElement>('button', {
      name: /Reset All Settings/,
    });

    expect(clearButton.disabled).toBe(true);
    expect(resetButton.disabled).toBe(true);

    fireEvent.click(clearButton);
    fireEvent.click(resetButton);

    expect(clearAllSettingsMock).not.toHaveBeenCalled();
    expect(resetAllSettingsMock).not.toHaveBeenCalled();
  });

  it('leaves both actions enabled when not busy', () => {
    render(<GeneralSectionFooter />);

    expect(
      screen.getByRole<HTMLButtonElement>('button', {
        name: /Clear All Settings/,
      }).disabled,
    ).toBe(false);
    expect(
      screen.getByRole<HTMLButtonElement>('button', {
        name: /Reset All Settings/,
      }).disabled,
    ).toBe(false);
  });
});
