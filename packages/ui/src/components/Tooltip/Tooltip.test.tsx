// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Tooltip } from './Tooltip.component';
import { TRANSITION_DURATION_MS } from './Tooltip.constants';

// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype method for teardown restore; binding would create a new function and break restoration
const savedShowPopover = HTMLElement.prototype.showPopover;
// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype method for teardown restore; binding would create a new function and break restoration
const savedHidePopover = HTMLElement.prototype.hidePopover;
const popoverMocksRef: {
  current: {
    readonly hidePopoverMock: ReturnType<typeof vi.fn>;
    readonly showPopoverMock: ReturnType<typeof vi.fn>;
  };
} = {
  current: {
    hidePopoverMock: vi.fn(),
    showPopoverMock: vi.fn(),
  },
};

afterEach(() => {
  HTMLElement.prototype.showPopover = savedShowPopover;
  HTMLElement.prototype.hidePopover = savedHidePopover;
  cleanup();
});

beforeEach(() => {
  vi.useFakeTimers();
  popoverMocksRef.current = {
    hidePopoverMock: vi.fn(),
    showPopoverMock: vi.fn(),
  };
  HTMLElement.prototype.showPopover = popoverMocksRef.current
    .showPopoverMock as HTMLElement['showPopover'];
  HTMLElement.prototype.hidePopover = popoverMocksRef.current
    .hidePopoverMock as HTMLElement['hidePopover'];
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(
    (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    },
  );
});

describe('Tooltip', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('adds keyboard semantics for non-interactive children and hides on Escape', () => {
    const hidePopoverSpy = vi.fn();
    HTMLElement.prototype.hidePopover = hidePopoverSpy;

    render(
      <Tooltip content='Keyboard tooltip'>
        <span>Open tooltip</span>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Open tooltip' });

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(popoverMocksRef.current.showPopoverMock).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(trigger, { key: 'Escape' });
    vi.advanceTimersByTime(TRANSITION_DURATION_MS);

    expect(hidePopoverSpy).toHaveBeenCalledTimes(1);
  });

  it('does not add button semantics when the child is already interactive', () => {
    render(
      <Tooltip content='Native tooltip'>
        <button type='button'>Native action</button>
      </Tooltip>,
    );

    const triggerSpan = document.querySelector('[aria-describedby]');
    expect(triggerSpan?.getAttribute('role')).toBeNull();
    expect(triggerSpan?.getAttribute('tabindex')).toBeNull();
  });
});
