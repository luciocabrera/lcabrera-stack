// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const { mockSetSorting, normalizedColumnRef } = vi.hoisted(() => ({
  mockSetSorting: vi.fn(),
  normalizedColumnRef: { current: {} as Record<string, unknown> },
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useSetColumnSorting: () => mockSetSorting,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => normalizedColumnRef.current,
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

beforeEach(() => {
  normalizedColumnRef.current = { key: 'name', label: 'Name' };
});

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

  it('is disabled when the column has no sorting capability', () => {
    normalizedColumnRef.current = {
      isSortable: false,
      key: 'name',
      label: 'Name',
    };

    render(<SortDescendingButton columnKey='name' onClose={mockOnClose} />);

    expect(getButton().disabled).toBe(true);
  });
});
