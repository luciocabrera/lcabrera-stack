// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { clearAllSettingsMock, resetTableSettingsMock } = vi.hoisted(() => ({
  clearAllSettingsMock: vi.fn(),
  resetTableSettingsMock: vi.fn(),
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

vi.mock('@repo/ui/components/Icons', () => ({
  EraserIcon: () => <span>Eraser icon</span>,
  RefreshIcon: () => <span>Refresh icon</span>,
}));

vi.mock('@repo/ui/components/SidePanel', () => ({
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

    expect(screen.getByRole('heading', { name: 'All Settings' })).not.toBe(
      null,
    );
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
});
