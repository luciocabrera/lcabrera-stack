// @vitest-environment jsdom

import type { RefObject } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VirtualSelectHeader } from './VirtualSelectHeader.component';

const valueByLabel: Record<string, string> = {
  Alpha: 'alpha-id',
  Bravo: 'bravo-id',
};

const createProps = () => ({
  getValueFromLabel: (label: string) => valueByLabel[label] ?? label,
  isAlwaysOpen: false,
  isBusy: false,
  isOpen: false,
  listboxId: 'listbox-id',
  mode: 'single' as const,
  onChange: vi.fn(),
  onToggle: vi.fn(),
  overflowCount: 0,
  placeholder: 'Select...',
  selected: [] as readonly string[],
  triggerRef: {
    current: undefined,
  } as RefObject<HTMLButtonElement | HTMLDivElement | undefined>,
  visibleTags: [] as readonly string[],
});

afterEach(() => {
  cleanup();
});

describe('VirtualSelectHeader', () => {
  it('renders the trigger without an overlay and toggles on click', () => {
    const props = createProps();

    render(<VirtualSelectHeader {...props} />);

    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Select...' }));

    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders the shimmer overlay and a disabled trigger while busy', () => {
    const props = { ...createProps(), isBusy: true };

    render(<VirtualSelectHeader {...props} />);

    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull();

    const trigger = screen.getByRole('button', { name: 'Select...' });

    expect(trigger.hasAttribute('disabled')).toBe(true);

    fireEvent.click(trigger);

    expect(props.onToggle).not.toHaveBeenCalled();
  });

  it('removes a tag by mapping its label back to the selected value', () => {
    const props = {
      ...createProps(),
      mode: 'multi' as const,
      selected: ['alpha-id', 'bravo-id'] as readonly string[],
      visibleTags: ['Alpha', 'Bravo'] as readonly string[],
    };

    render(<VirtualSelectHeader {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }));

    expect(props.onChange).toHaveBeenCalledWith(['bravo-id']);
  });
});
