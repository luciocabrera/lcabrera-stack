// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SelectOption } from './SelectOption.component';

afterEach(() => {
  cleanup();
});

describe('SelectOption', () => {
  it('renders the option text', () => {
    render(
      <SelectOption
        hasCheckbox
        isLoading={false}
        isSelected={false}
        onToggle={() => void 0}
        option='Option A'
      />,
    );
    expect(screen.getByText('Option A').textContent).toBe('Option A');
  });

  it('renders checkbox as checked when isSelected is true', () => {
    render(
      <SelectOption
        hasCheckbox
        isLoading={false}
        isSelected
        onToggle={() => void 0}
        option='Option B'
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.checked).toBe(true);
  });

  it('calls onToggle when checkbox changes', () => {
    const onToggle = vi.fn();
    render(
      <SelectOption
        hasCheckbox
        isLoading={false}
        isSelected={false}
        onToggle={onToggle}
        option='Option C'
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders as disabled when isLoading is true', () => {
    render(
      <SelectOption
        hasCheckbox
        isLoading
        isSelected={false}
        onToggle={() => void 0}
        option='Loading option'
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.disabled).toBe(true);
  });

  it('does not render checkbox when hasCheckbox is false', () => {
    render(
      <SelectOption
        hasCheckbox={false}
        isLoading={false}
        isSelected={false}
        onToggle={() => void 0}
        option='No checkbox'
      />,
    );
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getByText('No checkbox').textContent).toBe('No checkbox');
  });
});
