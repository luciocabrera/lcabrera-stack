// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TooltipTriggerProps } from './TooltipTrigger.types';

import { TooltipTrigger } from './TooltipTrigger.component';

afterEach(cleanup);

const renderTrigger = (overrides?: Partial<TooltipTriggerProps>) => {
  const props = {
    anchorName: '--tooltip-test',
    children: <span>Open tooltip</span>,
    id: 'tooltip-test',
    onHide: vi.fn(),
    onShow: vi.fn(),
    ref: createRef<HTMLSpanElement>(),
    ...overrides,
  };
  const view = render(<TooltipTrigger {...props} />);
  const trigger = view.container.querySelector('[aria-describedby]');
  if (!(trigger instanceof HTMLSpanElement)) {
    throw new TypeError('Expected tooltip trigger span to exist');
  }
  return { props, trigger };
};

describe('TooltipTrigger', () => {
  it('renders children inside a span linked to the popover id', () => {
    const { trigger } = renderTrigger();

    expect(trigger.textContent).toBe('Open tooltip');
    expect(trigger.getAttribute('aria-describedby')).toBe('tooltip-test');
  });

  it('does not carry popovertarget, which is inert on a span', () => {
    const { trigger } = renderTrigger();

    // Only `button` and `input` can be popover invokers, so the attribute did
    // nothing here — `Tooltip` drives the popover with `showPopover()` /
    // `hidePopover()` on a ref instead.
    expect(trigger.hasAttribute('popovertarget')).toBe(false);
  });

  it('forwards the ref to the trigger span', () => {
    const ref = createRef<HTMLSpanElement>();
    const { trigger } = renderTrigger({ ref });

    expect(ref.current).toBe(trigger);
  });

  it('calls onShow on mouse enter, focus, and touch start', () => {
    const { props, trigger } = renderTrigger();

    fireEvent.mouseEnter(trigger);
    fireEvent.focus(trigger);
    fireEvent.touchStart(trigger);

    expect(props.onShow).toHaveBeenCalledTimes(3);
    expect(props.onHide).not.toHaveBeenCalled();
  });

  it('calls onHide on mouse leave, blur, and touch end', () => {
    const { props, trigger } = renderTrigger();

    fireEvent.mouseLeave(trigger);
    fireEvent.blur(trigger);
    fireEvent.touchEnd(trigger);

    expect(props.onHide).toHaveBeenCalledTimes(3);
    expect(props.onShow).not.toHaveBeenCalled();
  });

  it('adds button semantics and keyboard handling for non-interactive children', () => {
    const { props } = renderTrigger();
    const trigger = screen.getByRole('button', { name: 'Open tooltip' });

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(props.onShow).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(trigger, { key: ' ' });
    expect(props.onShow).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(props.onHide).toHaveBeenCalledTimes(1);

    expect(trigger.getAttribute('tabindex')).toBe('0');
  });

  it('ignores other keys on interactive triggers', () => {
    const { props, trigger } = renderTrigger();

    fireEvent.keyDown(trigger, { key: 'a' });

    expect(props.onShow).not.toHaveBeenCalled();
    expect(props.onHide).not.toHaveBeenCalled();
  });

  it('does not add button semantics or keyboard handling for native interactive children', () => {
    const { props, trigger } = renderTrigger({
      children: <button type='button'>Native action</button>,
    });

    expect(trigger.getAttribute('role')).toBeNull();
    expect(trigger.getAttribute('tabindex')).toBeNull();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(props.onShow).not.toHaveBeenCalled();
  });
});
