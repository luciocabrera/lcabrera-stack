// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

type MockSectionProps = {
  readonly isBusy?: boolean;
};

vi.mock('./ColumnAxisSection', () => ({
  ColumnAxisSection: ({ isBusy }: MockSectionProps) => (
    <div data-busy={String(isBusy)}>Column axis section</div>
  ),
}));

vi.mock('./GroupingModeSection', () => ({
  GroupingModeSection: ({ isBusy }: MockSectionProps) => (
    <div data-busy={String(isBusy)}>Grouping mode section</div>
  ),
}));

vi.mock('./TotalsPlacementSection', () => ({
  TotalsPlacementSection: ({ isBusy }: MockSectionProps) => (
    <div data-busy={String(isBusy)}>Totals placement section</div>
  ),
}));

import { AdvancedSettingsSection } from './AdvancedSettingsSection.component';

afterEach(() => {
  cleanup();
});

describe('AdvancedSettingsSection', () => {
  it('composes the axis picker with the totals controls', () => {
    render(<AdvancedSettingsSection />);

    expect(screen.getByText('Column axis section')).not.toBeNull();
    expect(screen.getByText('Grouping mode section')).not.toBeNull();
    expect(screen.getByText('Totals placement section')).not.toBeNull();
  });

  it('forwards the busy flag to every subsection', () => {
    render(<AdvancedSettingsSection isBusy />);

    expect(screen.getByText('Column axis section').dataset.busy).toBe('true');
    expect(screen.getByText('Grouping mode section').dataset.busy).toBe('true');
    expect(screen.getByText('Totals placement section').dataset.busy).toBe(
      'true',
    );
  });
});
