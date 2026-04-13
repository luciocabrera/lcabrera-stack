// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Tooltip } from './Tooltip.component.tsx';

// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype method for teardown restore; binding would create a new function and break restoration
const savedShowPopover = HTMLElement.prototype.showPopover;
// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype method for teardown restore; binding would create a new function and break restoration
const savedHidePopover = HTMLElement.prototype.hidePopover;

afterEach(() => {
  HTMLElement.prototype.showPopover = savedShowPopover;
  HTMLElement.prototype.hidePopover = savedHidePopover;
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
    const showPopoverSpy = vi.fn();
    HTMLElement.prototype.showPopover = showPopoverSpy;

    render(
      <Tooltip content='Focus tooltip'>
        <button type='button'>Focus me</button>
      </Tooltip>,
    );

    const triggerSpan = document.querySelector('[aria-describedby]');
    if (triggerSpan === null) {
      throw new Error('Expected tooltip trigger to exist');
    }

    fireEvent.focus(triggerSpan);
    expect(showPopoverSpy).toHaveBeenCalled();
  });
});
