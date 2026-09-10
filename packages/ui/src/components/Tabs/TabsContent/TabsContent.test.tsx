// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { spacing } from '#ui/design-system/tokens/base.stylex';

import { TABS_FIXTURE as tabs } from '../Tabs.fixtures';
import { TabsContent } from './TabsContent.component';

const referenceStyles = stylex.create({
  inset: { paddingInline: spacing.sm },
});

afterEach(() => {
  cleanup();
});

const toClassNames = (element: Element | null) =>
  (element?.getAttribute('class') ?? '').split(' ').filter(Boolean);

const insetClassNames = (stylex.props(referenceStyles.inset).className ?? '')
  .split(' ')
  .filter(Boolean);

const renderPaddingPair = () => {
  render(
    <TabsContent
      activeTab='padded'
      tabs={[
        { children: <span>Padded</span>, header: 'Padded', key: 'padded' },
        {
          children: <span>Flush</span>,
          hasPadding: false,
          header: 'Flush',
          key: 'flush',
        },
      ]}
    />,
  );

  return {
    flush: toClassNames(document.querySelector('#tabpanel-flush')),
    padded: toClassNames(document.querySelector('#tabpanel-padded')),
  };
};

describe('TabsContent', () => {
  it('keeps every panel mounted, including hidden ones', () => {
    render(<TabsContent activeTab='a' tabs={tabs} />);
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(3);
    expect(screen.getByText('Content A')).not.toBeNull();
    expect(screen.getByText('Content B')).not.toBeNull();
    expect(screen.getByText('Content C')).not.toBeNull();
  });

  it('shows only the active panel', () => {
    render(<TabsContent activeTab='b' tabs={tabs} />);
    const visiblePanels = screen.getAllByRole('tabpanel');
    expect(visiblePanels).toHaveLength(1);
    expect(visiblePanels[0]?.getAttribute('id')).toBe('tabpanel-b');
  });

  it('wires each panel to its tab button via ARIA attributes', () => {
    render(<TabsContent activeTab='a' tabs={tabs} />);
    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    for (const [index, tab] of tabs.entries()) {
      expect(panels[index]?.getAttribute('id')).toBe(`tabpanel-${tab.key}`);
      expect(panels[index]?.getAttribute('aria-labelledby')).toBe(
        `tab-${tab.key}`,
      );
    }
  });

  it('makes panels focusable', () => {
    render(<TabsContent activeTab='a' tabs={tabs} />);
    const visiblePanels = screen.getAllByRole('tabpanel');
    expect(visiblePanels[0]?.getAttribute('tabIndex')).toBe('0');
  });
});

describe('TabsContent horizontal inset', () => {
  it('compiles a non-empty reference for the inset it is looking for', () => {
    expect(
      insetClassNames.length,
      'The reference declaration compiled to no class, so every case below would pass without checking anything.',
    ).toBeGreaterThan(0);
  });

  it('insets a tab that says nothing about padding', () => {
    const { padded } = renderPaddingPair();

    expect(
      insetClassNames.every((className) => padded.includes(className)),
      'A tab that declares no `hasPadding` no longer carries the inset declaration, so the inset is not the default.',
    ).toBe(true);
  });

  it('drops the inset from a tab that opts out of it', () => {
    const { flush } = renderPaddingPair();

    expect(
      insetClassNames.some((className) => flush.includes(className)),
      '`hasPadding: false` left the inset declaration on the panel.',
    ).toBe(false);
  });
});
