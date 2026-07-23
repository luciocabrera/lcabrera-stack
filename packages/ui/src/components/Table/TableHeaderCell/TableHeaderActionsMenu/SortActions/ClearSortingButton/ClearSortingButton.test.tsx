// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const { mockSetSorting } = vi.hoisted(() => ({
  mockSetSorting: vi.fn(),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnSorting: () => mockSetSorting,
  }),
);

vi.mock('@lcabrera/ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
  },
}));

import { ClearSortingButton } from './ClearSortingButton.component';

const mockOnClose = vi.fn();

const getButton = () => {
  const button = screen.getByText('Clear Sorting').closest('button');
  if (button === null) throw new Error('No Clear Sorting button');
  return button;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ClearSortingButton', () => {
  it('is disabled when no sort is applied', () => {
    render(<ClearSortingButton columnKey='name' onClose={mockOnClose} />);

    expect(getButton().disabled).toBe(true);
  });

  it('clears the sort and closes the menu when a sort is applied', () => {
    render(
      <ClearSortingButton
        columnKey='name'
        onClose={mockOnClose}
        sortDirection='asc'
      />,
    );

    expect(getButton().disabled).toBe(false);

    fireEvent.click(getButton());

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: undefined,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
