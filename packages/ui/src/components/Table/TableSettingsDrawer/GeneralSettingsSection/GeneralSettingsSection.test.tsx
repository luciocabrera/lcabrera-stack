// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

type MockToolbarProps = {
  readonly isBusy?: boolean;
};

vi.mock('@repo/ui/components/InfoBox', () => ({
  InfoBox: ({ children }: { readonly children: ReactNode }) => (
    <aside>{children}</aside>
  ),
}));

vi.mock('@repo/ui/components/SidePanel', () => ({
  SidePanelSection: ({ children }: { readonly children: ReactNode }) => (
    <section>{children}</section>
  ),
  SidePanelSectionHeader: ({ title }: { readonly title: string }) => (
    <h3>{title}</h3>
  ),
  SidePanelSectionMain: ({ children }: { readonly children: ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock('../ColumnOrderSection/ColumnOrderSectionToolbar', () => ({
  ColumnOrderSectionToolbar: ({ isBusy }: MockToolbarProps) => (
    <div data-busy={String(isBusy)}>Column order toolbar</div>
  ),
}));

vi.mock('../FiltersSection/FiltersSectionToolbar', () => ({
  FiltersSectionToolbar: ({ isBusy }: MockToolbarProps) => (
    <div data-busy={String(isBusy)}>Filters toolbar</div>
  ),
}));

vi.mock('../SortingSection/SortingSectionToolbar', () => ({
  SortingSectionToolbar: ({ isBusy }: MockToolbarProps) => (
    <div data-busy={String(isBusy)}>Sorting toolbar</div>
  ),
}));

vi.mock('./AllSettingsSection/AllSettingsSection.component', () => ({
  AllSettingsSection: ({ isBusy }: MockToolbarProps) => (
    <div data-busy={String(isBusy)}>All settings section</div>
  ),
}));

vi.mock('./ColumnWidthsSection/ColumnWidthsSection.component', () => ({
  ColumnWidthsSection: ({ isBusy }: MockToolbarProps) => (
    <div data-busy={String(isBusy)}>Column widths section</div>
  ),
}));

import { GeneralSettingsSection } from './GeneralSettingsSection.component';

afterEach(() => {
  cleanup();
});

describe('GeneralSettingsSection', () => {
  it('composes width presets, section toolbars, and all-settings actions', () => {
    render(<GeneralSettingsSection />);

    expect(screen.getByText('Column widths section')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Filters' })).not.toBeNull();
    expect(screen.getByText('Filters toolbar')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Sorting' })).not.toBeNull();
    expect(screen.getByText('Sorting toolbar')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Columns' })).not.toBeNull();
    expect(screen.getByText('Column order toolbar')).not.toBeNull();
    expect(screen.getByText('All settings section')).not.toBeNull();
    expect(
      screen.getByText(/Select a preset to adjust all column widths/),
    ).not.toBeNull();
  });

  it('forwards the busy flag to every subsection', () => {
    render(<GeneralSettingsSection isBusy />);

    const busyNodes = [
      'Column widths section',
      'Filters toolbar',
      'Sorting toolbar',
      'Column order toolbar',
      'All settings section',
    ].map((label) => screen.getByText(label));

    for (const node of busyNodes) {
      expect(node.dataset.busy).toBe('true');
    }
  });
});
