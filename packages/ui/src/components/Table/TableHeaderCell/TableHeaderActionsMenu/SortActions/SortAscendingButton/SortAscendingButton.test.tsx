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

import { SortAscendingButton } from './SortAscendingButton.component';

const mockOnClose = vi.fn();

const getButton = () => {
  const button = screen.getByText('Ascending').closest('button');
  if (button === null) throw new Error('No Ascending button');
  return button;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SortAscendingButton', () => {
  it('applies ascending and closes the menu when not currently active', () => {
    render(<SortAscendingButton columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(getButton());

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: 'asc',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('toggles ascending off when it is already the active direction', () => {
    render(
      <SortAscendingButton
        columnKey='name'
        onClose={mockOnClose}
        sortDirection='asc'
      />,
    );

    fireEvent.click(getButton());

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: undefined,
    });
  });

  it('marks itself pressed only while ascending is applied', () => {
    const { rerender } = render(
      <SortAscendingButton columnKey='name' onClose={mockOnClose} />,
    );
    expect(getButton().getAttribute('aria-pressed')).toBe('false');

    rerender(
      <SortAscendingButton
        columnKey='name'
        onClose={mockOnClose}
        sortDirection='asc'
      />,
    );
    expect(getButton().getAttribute('aria-pressed')).toBe('true');
  });
});
