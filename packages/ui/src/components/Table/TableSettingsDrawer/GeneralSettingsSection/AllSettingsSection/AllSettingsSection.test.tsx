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

const { clearAllSettingsMock, resetTableSettingsMock } = vi.hoisted(() => ({
  clearAllSettingsMock: vi.fn(),
  resetTableSettingsMock: vi.fn(),
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

vi.mock('@lcabrera/ui/components/Icons', () => ({
  EraserIcon: () => <span>Eraser icon</span>,
  RefreshIcon: () => <span>Refresh icon</span>,
}));

vi.mock('@lcabrera/ui/components/SidePanel', () => ({
  SidePanelSection: ({ children }: { readonly children: ReactNode }) => (
    <section>{children}</section>
  ),
  SidePanelSectionHeader: ({ title }: { readonly title: string }) => (
    <h3>{title}</h3>
  ),
}));

vi.mock('../../TableDrawerContext/actions', () => ({
  useClearAllSettings: () => clearAllSettingsMock,
  useResetTableSettings: () => resetTableSettingsMock,
}));

import { AllSettingsSection } from './AllSettingsSection.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  clearAllSettingsMock.mockReset();
  resetTableSettingsMock.mockReset();
});

describe('AllSettingsSection', () => {
  it('renders the section header', () => {
    render(<AllSettingsSection />);

    expect(
      screen.getByRole('heading', { name: 'All Settings' }),
    ).not.toBeNull();
  });

  it('clears all settings through the drawer action', () => {
    render(<AllSettingsSection />);

    fireEvent.click(screen.getByRole('button', { name: /Clear All Settings/ }));

    expect(clearAllSettingsMock).toHaveBeenCalledTimes(1);
    expect(resetTableSettingsMock).not.toHaveBeenCalled();
  });

  it('resets all settings through the drawer action', () => {
    render(<AllSettingsSection />);

    fireEvent.click(screen.getByRole('button', { name: /Reset All Settings/ }));

    expect(resetTableSettingsMock).toHaveBeenCalledTimes(1);
    expect(clearAllSettingsMock).not.toHaveBeenCalled();
  });

  it('disables both actions while busy, so neither fires', () => {
    render(<AllSettingsSection isBusy />);

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
    expect(resetTableSettingsMock).not.toHaveBeenCalled();
  });

  it('leaves both actions enabled when not busy', () => {
    render(<AllSettingsSection />);

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
