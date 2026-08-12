// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const { mockSetSorting } = vi.hoisted(() => ({
  mockSetSorting: vi.fn(),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useSetColumnSorting: () => mockSetSorting,
}));

vi.mock('#ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
  },
}));

import { SortDescendingButton } from './SortDescendingButton.component';

const mockOnClose = vi.fn();

const getButton = () => {
  const button = screen.getByText('Descending').closest('button');
  if (button === null) throw new Error('No Descending button');
  return button;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SortDescendingButton', () => {
  it('applies descending and closes the menu when not currently active', () => {
    render(<SortDescendingButton columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(getButton());

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: 'desc',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('toggles descending off when it is already the active direction', () => {
    render(
      <SortDescendingButton
        columnKey='name'
        onClose={mockOnClose}
        sortDirection='desc'
      />,
    );

    fireEvent.click(getButton());

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: undefined,
    });
  });

  it('marks itself pressed only while descending is applied', () => {
    const { rerender } = render(
      <SortDescendingButton columnKey='name' onClose={mockOnClose} />,
    );
    expect(getButton().getAttribute('aria-pressed')).toBe('false');

    rerender(
      <SortDescendingButton
        columnKey='name'
        onClose={mockOnClose}
        sortDirection='desc'
      />,
    );
    expect(getButton().getAttribute('aria-pressed')).toBe('true');
  });
});
