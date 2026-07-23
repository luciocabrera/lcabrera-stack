// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { TableCheckDisplay } from './TableCheckDisplay.component';

describe('TableCheckDisplay', () => {
  it('renders unchecked state when value is falsy', () => {
    render(<TableCheckDisplay value={0} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Unchecked' });
    expect((checkbox as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByTestId('table-check-display-icon')).toBeNull();
  });

  it('renders checked state when value is truthy', () => {
    render(<TableCheckDisplay value='yes' />);

    const checkbox = screen.getByRole('checkbox', { name: 'Checked' });
    expect((checkbox as HTMLInputElement).checked).toBe(true);
    expect(screen.getByTestId('table-check-display-icon')).not.toBeNull();
  });

  it('uses column label in accessible name', () => {
    render(<TableCheckDisplay label='Active' value={false} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Active: No' });
    expect((checkbox as HTMLInputElement).checked).toBe(false);
  });
});
