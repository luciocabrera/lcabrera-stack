// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToggleSwitch } from './ToggleSwitch.component';

afterEach(cleanup);

describe('ToggleSwitch', () => {
  it('renders a switch role with checked=false when isChecked is false', () => {
    render(<ToggleSwitch isChecked={false} label='Toggle' onChange={vi.fn()} />);

    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
  });

  it('renders a switch role with checked=true when isChecked is true', () => {
    render(<ToggleSwitch isChecked label='Toggle' onChange={vi.fn()} />);

    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('renders the label text when label prop is provided', () => {
    render(<ToggleSwitch isChecked={false} label='Enable notifications' onChange={vi.fn()} />);

    expect(screen.getByText('Enable notifications').textContent).toBe('Enable notifications');
  });

  it('calls onChange with true when unchecked switch is clicked', () => {
    const handleChange = vi.fn();

    render(<ToggleSwitch isChecked={false} label='Toggle' onChange={handleChange} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('renders as disabled when isDisabled is true', () => {
    render(<ToggleSwitch isChecked={false} isDisabled label='Toggle' onChange={vi.fn()} />);

    expect((screen.getByRole('switch') as HTMLInputElement).disabled).toBe(true);
  });
});
