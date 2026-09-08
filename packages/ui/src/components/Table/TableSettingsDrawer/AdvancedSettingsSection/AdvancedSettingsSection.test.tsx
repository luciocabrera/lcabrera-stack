// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

type MockSectionProps = {
  readonly isBusy?: boolean;
};

const { isGroupingEnabledRef } = vi.hoisted(() => ({
  isGroupingEnabledRef: { current: true },
}));

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelSectionMain: ({ children }: { readonly children: ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableIsGroupingEnabled: () => isGroupingEnabledRef.current,
}));

vi.mock('./GroupingModeSection', () => ({
  GroupingModeSection: ({ isBusy }: MockSectionProps) => (
    <div data-busy={String(isBusy)}>Grouping mode section</div>
  ),
}));

vi.mock('./TabsOrderSection', () => ({
  TabsOrderSection: ({ isBusy }: MockSectionProps) => (
    <div data-busy={String(isBusy)}>Tabs order section</div>
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

beforeEach(() => {
  isGroupingEnabledRef.current = true;
});

describe('AdvancedSettingsSection', () => {
  it('composes the totals controls and the tab order', () => {
    render(<AdvancedSettingsSection />);

    expect(screen.getByText('Grouping mode section')).not.toBeNull();
    expect(screen.getByText('Totals placement section')).not.toBeNull();
    expect(screen.getByText('Tabs order section')).not.toBeNull();
  });

  it('keeps the tab order for a route that cannot group, and drops the totals', () => {
    isGroupingEnabledRef.current = false;

    render(<AdvancedSettingsSection />);

    expect(screen.queryByText('Grouping mode section')).toBeNull();
    expect(screen.queryByText('Totals placement section')).toBeNull();
    expect(screen.getByText('Tabs order section')).not.toBeNull();
  });

  it('forwards the busy flag to every subsection', () => {
    render(<AdvancedSettingsSection isBusy />);

    const busyNodes = [
      'Grouping mode section',
      'Totals placement section',
      'Tabs order section',
    ].map((label) => screen.getByText(label));

    for (const node of busyNodes) {
      expect(node.dataset.busy).toBe('true');
    }
  });
});
