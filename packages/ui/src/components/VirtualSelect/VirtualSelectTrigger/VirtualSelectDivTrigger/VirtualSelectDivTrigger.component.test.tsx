// @vitest-environment jsdom

import type { RefObject } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VirtualSelectDivTrigger } from './VirtualSelectDivTrigger.component';

const createProps = () => ({
  isAlwaysOpen: false,
  isBusy: false,
  isOpen: false,
  listboxId: 'listbox-id',
  mode: 'multi' as const,
  onToggle: vi.fn(),
  triggerRef: {
    current: undefined,
  } as RefObject<HTMLButtonElement | HTMLDivElement | undefined>,
});

afterEach(() => {
  cleanup();
});

describe('VirtualSelectDivTrigger', () => {
  it('renders an interactive div with listbox aria wiring and assigns the ref', () => {
    const props = createProps();

    render(
      <VirtualSelectDivTrigger {...props}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );

    const trigger = screen.getByRole('button');

    expect(trigger.tagName).toBe('DIV');
    expect(trigger.getAttribute('aria-controls')).toBe('listbox-id');
    expect(trigger.getAttribute('aria-disabled')).toBe('false');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('tabindex')).toBe('0');
    expect(props.triggerRef.current).toBe(trigger);
    expect(screen.getByText('Alpha').textContent).toBe('Alpha');
  });

  it('toggles on click and on Enter/Space key presses only', () => {
    const props = createProps();

    render(
      <VirtualSelectDivTrigger {...props}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );

    const trigger = screen.getByRole('button');

    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: ' ' });
    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(props.onToggle).toHaveBeenCalledTimes(3);
  });

  it('disables interaction while busy', () => {
    const props = {
      ...createProps(),
      isBusy: true,
    };

    render(
      <VirtualSelectDivTrigger {...props}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );

    const trigger = screen.getByRole('button');

    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('tabindex')).toBe('-1');

    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(props.onToggle).not.toHaveBeenCalled();
  });

  it('renders a static non-interactive shell when always open', () => {
    const props = {
      ...createProps(),
      isAlwaysOpen: true,
    };

    const { container } = render(
      <VirtualSelectDivTrigger {...props}>
        <span>Alpha</span>
      </VirtualSelectDivTrigger>,
    );

    const trigger = container.firstChild as HTMLDivElement | null;

    expect(trigger?.tagName).toBe('DIV');
    expect(trigger?.getAttribute('role')).toBeNull();
    expect(trigger?.getAttribute('aria-expanded')).toBeNull();
    expect(props.triggerRef.current).toBe(trigger);
    expect(screen.getByText('Alpha').textContent).toBe('Alpha');
  });
});
