// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Checkbox } from './Checkbox.component';

afterEach(() => {
  cleanup();
});

describe('Checkbox', () => {
  it('renders an unchecked checkbox without icon', () => {
    render(<Checkbox isChecked={false} />);

    const checkbox = screen.getByRole<HTMLInputElement>('checkbox');
    expect(checkbox.checked).toBe(false);
  });

  it('renders check icon when checked', () => {
    render(<Checkbox dataTestId='checkbox-icon' isChecked isReadOnly />);

    const checkbox = screen.getByRole<HTMLInputElement>('checkbox');
    expect(checkbox.checked).toBe(true);
    expect(screen.getByTestId('checkbox-icon')).not.toBeNull();
  });

  it('calls onChange when clicked', () => {
    const onChange = vi.fn();
    render(<Checkbox isChecked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
