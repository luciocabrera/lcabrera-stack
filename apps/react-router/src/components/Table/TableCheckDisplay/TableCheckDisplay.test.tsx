// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TableCheckDisplay } from './TableCheckDisplay.component';

describe('TableCheckDisplay', () => {
  it('renders unchecked state when value is falsy', () => {
    render(<TableCheckDisplay value={0} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Unchecked' });
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
  });

  it('renders checked state when value is truthy', () => {
    render(<TableCheckDisplay value='yes' />);

    const checkbox = screen.getByRole('checkbox', { name: 'Checked' });
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  });

  it('uses column label in accessible name', () => {
    render(<TableCheckDisplay label='Active' value={false} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Active: No' });
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
  });
});
