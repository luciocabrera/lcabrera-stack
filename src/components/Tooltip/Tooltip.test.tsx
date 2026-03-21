// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Tooltip } from './Tooltip.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  HTMLElement.prototype.showPopover = vi.fn();
  HTMLElement.prototype.hidePopover = vi.fn();
});

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip content='Helpful tooltip'>
        <button type='button'>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).not.toBeNull();
  });

  it('renders tooltip content with role tooltip', () => {
    render(
      <Tooltip content='This is a tooltip'>
        <span>Target</span>
      </Tooltip>,
    );
    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip.textContent).toContain('This is a tooltip');
  });

  it('shows popover when trigger receives focus', () => {
    const showPopover = vi.fn();
    HTMLElement.prototype.showPopover = showPopover;

    render(
      <Tooltip content='Focus tooltip'>
        <button type='button'>Focus me</button>
      </Tooltip>,
    );

    const triggerSpan = document.querySelector('[aria-describedby]') as HTMLElement;
    if (triggerSpan) {
      fireEvent.focus(triggerSpan);
    }
    expect(showPopover).toHaveBeenCalled();
  });
});
