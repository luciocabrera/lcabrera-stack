// @vitest-environment jsdom

import type { RefObject } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VirtualSelectTrigger } from './VirtualSelectTrigger.component';

const createProps = () => ({
  isAlwaysOpen: false,
  isOpen: false,
  listboxId: 'listbox-id',
  mode: 'single' as const,
  onRemoveTag: vi.fn(),
  onToggle: vi.fn(),
  overflowCount: 0,
  placeholder: 'Pick one',
  selected: [] as readonly string[],
  triggerRef: {
    current: null,
  } as RefObject<HTMLButtonElement | HTMLDivElement | null>,
  visibleTags: [] as readonly string[],
});

afterEach(() => {
  cleanup();
});

describe('VirtualSelectTrigger', () => {
  it('renders the placeholder in the default button trigger and assigns the button ref', () => {
    const props = createProps();

    render(<VirtualSelectTrigger {...props} />);

    const trigger = screen.getByRole('button', { name: 'Pick one' });

    expect(trigger.tagName).toBe('BUTTON');
    expect(props.triggerRef.current).toBe(trigger);
  });

  it('renders the selected single value and toggles when clicked', () => {
    const props = {
      ...createProps(),
      selected: ['Alpha'],
    };

    render(<VirtualSelectTrigger {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));

    expect(screen.getByText('Alpha').textContent).toBe('Alpha');
    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders tag buttons with overflow text in multi mode and removes a tag', () => {
    const props = {
      ...createProps(),
      mode: 'multi' as const,
      onRemoveTag: vi.fn(),
      overflowCount: 2,
      selected: ['Alpha', 'Bravo', 'Charlie'],
      visibleTags: ['Alpha'],
    };

    const { container } = render(<VirtualSelectTrigger {...props} />);
    const trigger = container.querySelector('[role="button"]');

    expect(trigger?.tagName).toBe('DIV');

    fireEvent.keyDown(trigger as HTMLDivElement, { key: 'Enter' });
    fireEvent.keyDown(trigger as HTMLDivElement, { key: ' ' });
    fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }));

    expect(props.triggerRef.current).toBe(trigger);
    expect(props.onToggle).toHaveBeenCalledTimes(2);
    expect(props.onRemoveTag).toHaveBeenCalledWith('Alpha');
    expect(screen.getByText('+2 more').textContent).toBe('+2 more');
  });

  it('renders a static div when always open', () => {
    const props = {
      ...createProps(),
      isAlwaysOpen: true,
      mode: 'multi' as const,
      selected: ['Alpha'],
      visibleTags: ['Alpha'],
    };

    const { container } = render(<VirtualSelectTrigger {...props} />);
    const trigger = container.firstChild as HTMLDivElement | null;

    expect(trigger?.tagName).toBe('DIV');
    expect(trigger?.getAttribute('role')).toBeNull();
    expect(props.triggerRef.current).toBe(trigger);
    expect(screen.getByText('Alpha').textContent).toBe('Alpha');
  });
});
