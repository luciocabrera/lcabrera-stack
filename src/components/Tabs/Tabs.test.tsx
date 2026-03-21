// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Tabs } from './Tabs.component';

afterEach(() => {
  cleanup();
});

const tabs = [
  { children: <span>Content A</span>, header: 'Tab A', key: 'a' },
  { children: <span>Content B</span>, header: 'Tab B', key: 'b' },
  { children: <span>Content C</span>, header: 'Tab C', key: 'c' },
];

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
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    const tabB = screen.getByRole('tab', { name: 'Tab B' });
    expect(tabB.getAttribute('aria-selected')).toBe('true');
  });

  it('navigates to previous tab with ArrowLeft key', () => {
    render(<Tabs defaultSelectedTab='b' tabs={tabs} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    expect(tabA.getAttribute('aria-selected')).toBe('true');
  });

  it('navigates to first tab with Home key', () => {
    render(<Tabs defaultSelectedTab='c' tabs={tabs} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'Home' });
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    expect(tabA.getAttribute('aria-selected')).toBe('true');
  });

  it('navigates to last tab with End key', () => {
    render(<Tabs tabs={tabs} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'End' });
    const tabC = screen.getByRole('tab', { name: 'Tab C' });
    expect(tabC.getAttribute('aria-selected')).toBe('true');
  });

  it('wraps around from last tab to first with ArrowRight', () => {
    render(<Tabs defaultSelectedTab='c' tabs={tabs} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    expect(tabA.getAttribute('aria-selected')).toBe('true');
  });
});
