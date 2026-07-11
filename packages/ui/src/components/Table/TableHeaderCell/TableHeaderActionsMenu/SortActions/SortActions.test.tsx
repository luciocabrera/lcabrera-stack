// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockSetSorting } = vi.hoisted(() => ({
  mockSetSorting: vi.fn(),
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnSorting: () => mockSetSorting,
  }),
);

vi.mock('@repo/ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
  },
}));

import { SortActions } from './SortActions.component';

const mockOnClose = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SortActions', () => {
  it('shows Ascending/Descending but not Clear Sorting when no sort is applied', () => {
    render(<SortActions columnKey='name' onClose={mockOnClose} />);

    expect(screen.getByText('Ascending')).not.toBeNull();
    expect(screen.getByText('Descending')).not.toBeNull();
    expect(screen.queryByText('Clear Sorting')).toBeNull();
  });

  it('applies ascending and closes the menu when not currently active', () => {
    render(<SortActions columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Ascending'));

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: 'asc',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('toggles Ascending off when it is already the active direction', () => {
    render(
      <SortActions
        columnKey='name'
        onClose={mockOnClose}
        sortDirection='asc'
      />,
    );

    fireEvent.click(screen.getByText('Ascending'));

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: undefined,
    });
  });

  it('sets Descending when not currently active', () => {
    render(<SortActions columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Descending'));

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: 'desc',
    });
  });

  it('toggles Descending off when it is already the active direction', () => {
    render(
      <SortActions
        columnKey='name'
        onClose={mockOnClose}
        sortDirection='desc'
      />,
    );

    fireEvent.click(screen.getByText('Descending'));

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: undefined,
    });
  });

  it('shows Clear Sorting when a sort is applied and clears it on click', () => {
    render(
      <SortActions
        columnKey='name'
        onClose={mockOnClose}
        sortDirection='asc'
      />,
    );

    fireEvent.click(screen.getByText('Clear Sorting'));

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: undefined,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
