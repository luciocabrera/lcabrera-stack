// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

type MockSectionProps = {
  readonly isBusy?: boolean;
};

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelSectionMain: ({ children }: { readonly children: ReactNode }) => (
    <main>{children}</main>
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
  it('composes the two totals controls', () => {
    render(<AdvancedSettingsSection />);

    expect(screen.getByText('Grouping mode section')).not.toBeNull();
    expect(screen.getByText('Totals placement section')).not.toBeNull();
  });

  it('forwards the busy flag to every subsection', () => {
    render(<AdvancedSettingsSection isBusy />);

    const busyNodes = ['Grouping mode section', 'Totals placement section'].map(
      (label) => screen.getByText(label),
    );

    for (const node of busyNodes) {
      expect(node.dataset.busy).toBe('true');
    }
  });
});
