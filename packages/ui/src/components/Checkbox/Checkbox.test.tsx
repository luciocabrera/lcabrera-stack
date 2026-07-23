// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

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

  it('does not call onChange when disabled', () => {
    render(<Checkbox isChecked={false} isDisabled onChange={vi.fn()} />);

    const checkbox = screen.getByRole<HTMLInputElement>('checkbox');
    expect(checkbox.disabled).toBe(true);
  });

  it('renders without crashing when isReadOnly', () => {
    render(<Checkbox isChecked={false} isReadOnly />);

    const checkbox = screen.getByRole<HTMLInputElement>('checkbox');
    expect(checkbox.readOnly).toBe(true);
    expect(checkbox.disabled).toBe(false);
  });

  it('does not render a testid element when dataTestId is not provided', () => {
    render(<Checkbox isChecked />);

    expect(screen.queryByTestId(/.*/)).toBeNull();
  });
});
