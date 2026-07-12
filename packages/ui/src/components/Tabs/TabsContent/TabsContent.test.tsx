// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TabsContent } from './TabsContent.component';

afterEach(() => {
  cleanup();
});

const tabs = [
  { children: <span>Content A</span>, header: 'Tab A', key: 'a' },
  { children: <span>Content B</span>, header: 'Tab B', key: 'b' },
  { children: <span>Content C</span>, header: 'Tab C', key: 'c' },
];

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
