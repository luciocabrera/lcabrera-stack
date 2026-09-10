// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TABS_FIXTURE as tabs } from '../Tabs.fixtures';
import { TabsContent } from './TabsContent.component';

afterEach(() => {
  cleanup();
});

const toClassNames = (element: Element | null) =>
  (element?.getAttribute('class') ?? '').split(' ').filter(Boolean);

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
  it('paints a different panel class when a tab opts out of the inset', () => {
    const { flush, padded } = renderPaddingPair();

    expect(padded.length).toBeGreaterThan(0);
    expect(flush).not.toStrictEqual(padded);
  });

  it('leaves a tab that says nothing about padding inset', () => {
    const { flush, padded } = renderPaddingPair();

    const droppedByFlush = padded.filter(
      (className) => !flush.includes(className),
    );

    expect(
      droppedByFlush.length,
      'A tab that declares no `hasPadding` lost a class the opted-out tab also lacks, so the inset is no longer the default.',
    ).toBeGreaterThan(0);
  });
});
