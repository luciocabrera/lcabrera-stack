// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useSetColumnSorting: () => vi.fn(),
}));

vi.mock('#ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
  },
}));

import { SortActions } from './SortActions.component';

const mockOnClose = vi.fn();

const getButton = (label: string) => {
  const button = screen.getByText(label).closest('button');
  if (button === null) throw new Error(`No button for "${label}"`);
  return button;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SortActions', () => {
  it('composes the ascending, descending, and clear-sorting delegates', () => {
    render(<SortActions columnKey='name' onClose={mockOnClose} />);

    expect(screen.getByText('Ascending')).not.toBeNull();
    expect(screen.getByText('Descending')).not.toBeNull();
    expect(screen.getByText('Clear Sorting')).not.toBeNull();
  });

  it('threads the current sortDirection into each delegate', () => {
    render(
      <SortActions
        columnKey='name'
        onClose={mockOnClose}
        sortDirection='desc'
      />,
    );

    expect(getButton('Ascending').getAttribute('aria-pressed')).toBe('false');
    expect(getButton('Descending').getAttribute('aria-pressed')).toBe('true');
    expect(getButton('Clear Sorting').disabled).toBe(false);
  });

  it('disables Clear Sorting when no direction is applied', () => {
    render(<SortActions columnKey='name' onClose={mockOnClose} />);

    expect(getButton('Clear Sorting').disabled).toBe(true);
  });
});
