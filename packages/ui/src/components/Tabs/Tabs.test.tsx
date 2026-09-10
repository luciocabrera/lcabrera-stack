// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tabs } from './Tabs.component';
import { focusedTab, TABS_FIXTURE as tabs } from './Tabs.fixtures';

afterEach(() => {
  cleanup();
});

describe('Tabs', () => {
  it('renders all tab buttons', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole('tab', { name: 'Tab A' })).not.toBeNull();
    expect(screen.getByRole('tab', { name: 'Tab B' })).not.toBeNull();
    expect(screen.getByRole('tab', { name: 'Tab C' })).not.toBeNull();
  });

  it('selects the first tab by default', () => {
    render(<Tabs tabs={tabs} />);
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    expect(tabA.getAttribute('aria-selected')).toBe('true');
  });

  it('selects the specified defaultSelectedTab', () => {
    render(<Tabs defaultSelectedTab='b' tabs={tabs} />);
    const tabB = screen.getByRole('tab', { name: 'Tab B' });
    expect(tabB.getAttribute('aria-selected')).toBe('true');
  });

  it('switches to clicked tab', () => {
    render(<Tabs tabs={tabs} />);
    const tabB = screen.getByRole('tab', { name: 'Tab B' });
    fireEvent.click(tabB);
    expect(tabB.getAttribute('aria-selected')).toBe('true');
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    expect(tabA.getAttribute('aria-selected')).toBe('false');
  });

  it('navigates to next tab with ArrowRight key', () => {
    render(<Tabs tabs={tabs} />);
    fireEvent.keyDown(focusedTab(), { key: 'ArrowRight' });
    const tabB = screen.getByRole('tab', { name: 'Tab B' });
    expect(tabB.getAttribute('aria-selected')).toBe('true');
  });

  it.each([
    { expected: 'Tab A', from: 'b', key: 'ArrowLeft' },
    { expected: 'Tab A', from: 'c', key: 'Home' },
  ])('moves selection to $expected on $key', ({ expected, from, key }) => {
    render(<Tabs defaultSelectedTab={from} tabs={tabs} />);

    fireEvent.keyDown(focusedTab(), { key });

    expect(
      screen.getByRole('tab', { name: expected }).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('navigates to last tab with End key', () => {
    render(<Tabs tabs={tabs} />);
    fireEvent.keyDown(focusedTab(), { key: 'End' });
    const tabC = screen.getByRole('tab', { name: 'Tab C' });
    expect(tabC.getAttribute('aria-selected')).toBe('true');
  });

  it('wraps around from last tab to first with ArrowRight', () => {
    render(<Tabs defaultSelectedTab='c' tabs={tabs} />);
    fireEvent.keyDown(focusedTab(), { key: 'ArrowRight' });
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    expect(tabA.getAttribute('aria-selected')).toBe('true');
  });

  it('uses selectedTab when controlled', () => {
    render(<Tabs selectedTab='c' tabs={tabs} />);
    const tabC = screen.getByRole('tab', { name: 'Tab C' });
    expect(tabC.getAttribute('aria-selected')).toBe('true');
  });

  it('falls back to first tab when controlled selectedTab is missing', () => {
    render(<Tabs selectedTab='missing-tab' tabs={tabs} />);

    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    const tabB = screen.getByRole('tab', { name: 'Tab B' });

    expect(tabA.getAttribute('aria-selected')).toBe('true');
    expect(tabA.getAttribute('tabIndex')).toBe('0');
    expect(tabB.getAttribute('aria-selected')).toBe('false');
  });

  it('calls onSelectTab when selecting a tab in controlled mode', () => {
    let lastSelectedTab = '';

    render(
      <Tabs
        onSelectTab={(tabKey) => {
          lastSelectedTab = tabKey;
        }}
        selectedTab='a'
        tabs={tabs}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Tab B' }));
    expect(lastSelectedTab).toBe('b');
  });
});
