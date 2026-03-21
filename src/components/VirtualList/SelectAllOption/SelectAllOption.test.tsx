// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SelectAllOption } from './SelectAllOption.component';

afterEach(() => {
  cleanup();
});

describe('SelectAllOption', () => {
  it('renders "Select All" when not all selected', () => {
    render(
      <SelectAllOption
        isAllSelected={false}
        isLoading={false}
        onSelectAll={() => void 0}
      />,
    );
    expect(screen.getByText('Select All').textContent).toBe('Select All');
  });

  it('renders "Deselect All" when all selected', () => {
    render(
      <SelectAllOption
        isAllSelected
        isLoading={false}
        onSelectAll={() => void 0}
      />,
    );
    expect(screen.getByText('Deselect All').textContent).toBe('Deselect All');
  });

  it('calls onSelectAll when checkbox is changed', () => {
    const onSelectAll = vi.fn();
    render(
      <SelectAllOption
        isAllSelected={false}
        isLoading={false}
        onSelectAll={onSelectAll}
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });

  it('renders checkbox as checked when isAllSelected is true', () => {
    render(
      <SelectAllOption
        isAllSelected
        isLoading={false}
        onSelectAll={() => void 0}
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.checked).toBe(true);
  });

  it('renders checkbox as disabled when isLoading is true', () => {
    render(
      <SelectAllOption
        isAllSelected={false}
        isLoading
        onSelectAll={() => void 0}
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.disabled).toBe(true);
  });
});
