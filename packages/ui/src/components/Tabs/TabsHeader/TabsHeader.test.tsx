// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { TabsHeader } from './TabsHeader.component';

afterEach(() => {
  cleanup();
});

const tabs = [
  { children: <span>Content A</span>, header: 'Tab A', key: 'a' },
  { children: <span>Content B</span>, header: 'Tab B', key: 'b' },
  { children: <span>Content C</span>, header: 'Tab C', key: 'c' },
];

describe('TabsHeader', () => {
  it('renders one tab button per tab', () => {
    render(
      <TabsHeader
        activeTab='a'
        isBusy={false}
        onSelectTab={vi.fn()}
        tabs={tabs}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Tab A' })).not.toBeNull();
    expect(screen.getByRole('tab', { name: 'Tab B' })).not.toBeNull();
    expect(screen.getByRole('tab', { name: 'Tab C' })).not.toBeNull();
  });

  it('marks the active tab as selected with roving tabindex', () => {
    render(
      <TabsHeader
        activeTab='b'
        isBusy={false}
        onSelectTab={vi.fn()}
        tabs={tabs}
      />,
    );
    const tabB = screen.getByRole('tab', { name: 'Tab B' });
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    expect(tabB.getAttribute('aria-selected')).toBe('true');
    expect(tabB.getAttribute('tabIndex')).toBe('0');
    expect(tabA.getAttribute('aria-selected')).toBe('false');
    expect(tabA.getAttribute('tabIndex')).toBe('-1');
  });

  it('wires each tab button to its panel via ARIA attributes', () => {
    render(
      <TabsHeader
        activeTab='a'
        isBusy={false}
        onSelectTab={vi.fn()}
        tabs={tabs}
      />,
    );
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    expect(tabA.getAttribute('id')).toBe('tab-a');
    expect(tabA.getAttribute('aria-controls')).toBe('tabpanel-a');
  });

  it('calls onSelectTab with the clicked tab key', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab='a'
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Tab B' }));
    expect(onSelectTab).toHaveBeenCalledWith('b');
  });

  it('selects and focuses the next tab on ArrowRight', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab='a'
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onSelectTab).toHaveBeenCalledWith('b');
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: 'Tab B' }),
    );
  });

  // The wrap case is the interesting one, and a table puts it directly beside
  // the ordinary case rather than in a second block of identical scaffolding.
  it.each([
    { activeTab: 'b', expected: 'a', name: 'the previous tab' },
    { activeTab: 'a', expected: 'c', name: 'the last tab, wrapping' },
  ])('ArrowLeft from $activeTab selects $name', ({ activeTab, expected }) => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab={activeTab}
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });

    expect(onSelectTab).toHaveBeenCalledWith(expected);
  });

  it('selects the first tab on Home and the last on End', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab='b'
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(onSelectTab).toHaveBeenCalledWith('a');
    fireEvent.keyDown(tablist, { key: 'End' });
    expect(onSelectTab).toHaveBeenCalledWith('c');
  });

  it('ignores keys that are not part of tab navigation', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab='a'
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Enter' });
    expect(onSelectTab).not.toHaveBeenCalled();
  });

  it('disables all tab buttons when busy', () => {
    render(
      <TabsHeader activeTab='a' isBusy onSelectTab={vi.fn()} tabs={tabs} />,
    );
    const tabButtons = screen.getAllByRole('tab');
    expect(tabButtons).toHaveLength(3);
    for (const tabButton of tabButtons) {
      expect((tabButton as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('ignores keyboard navigation when busy', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader activeTab='a' isBusy onSelectTab={onSelectTab} tabs={tabs} />,
    );
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onSelectTab).not.toHaveBeenCalled();
  });

  it('falls back to the first tab as navigation origin when activeTab is unknown', () => {
    const onSelectTab = vi.fn();
    render(
      <TabsHeader
        activeTab='missing-tab'
        isBusy={false}
        onSelectTab={onSelectTab}
        tabs={tabs}
      />,
    );
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onSelectTab).toHaveBeenCalledWith('b');
  });
});
