// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const { groupingKeysRef, mockSetGrouping, normalizedColumnRef } = vi.hoisted(
  () => ({
    groupingKeysRef: { current: [] as readonly string[] },
    mockSetGrouping: vi.fn(),
    normalizedColumnRef: { current: {} as Record<string, unknown> },
  }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/actions', () => ({
  useSetTableGrouping: () => mockSetGrouping,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableGroupingKeys: () => groupingKeysRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => normalizedColumnRef.current,
}));

vi.mock('#ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: { menuIcon: {}, menuItem: {} },
}));

import { GroupActions } from './GroupActions.component';

const mockOnClose = vi.fn();

const getButton = (label: string) => {
  const button = screen.getByText(label).closest('button');

  if (button === null) throw new Error(`No button for "${label}"`);

  return button;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  groupingKeysRef.current = [];
  normalizedColumnRef.current = {};
});

describe('GroupActions', () => {
  it('composes the group-by and clear-grouping delegates', () => {
    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(screen.getByText('Group by This')).not.toBeNull();
    expect(screen.getByText('Clear Grouping')).not.toBeNull();
  });

  it('applies the column as the group key and closes the menu', () => {
    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    fireEvent.click(getButton('Group by This'));

    expect(mockSetGrouping).toHaveBeenCalledWith('order_status');
    expect(mockSetGrouping).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('marks itself active and toggles off when it is the applied key', () => {
    groupingKeysRef.current = ['order_status'];

    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(getButton('Group by This').getAttribute('aria-pressed')).toBe(
      'true',
    );

    fireEvent.click(getButton('Group by This'));

    expect(mockSetGrouping).toHaveBeenCalledWith(undefined);
  });

  it('stays inactive when another column is the applied key', () => {
    groupingKeysRef.current = ['priority'];

    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(getButton('Group by This').getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('disables Clear Grouping until some column is grouped', () => {
    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(getButton('Clear Grouping').disabled).toBe(true);
  });

  it('clears whichever key is applied, not only the one this column names', () => {
    groupingKeysRef.current = ['priority'];

    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(getButton('Clear Grouping').disabled).toBe(false);

    fireEvent.click(getButton('Clear Grouping'));

    expect(mockSetGrouping).toHaveBeenCalledWith(undefined);
  });

  it('disables both commands for a column the table declares ungroupable', () => {
    normalizedColumnRef.current = { isGroupable: false };
    groupingKeysRef.current = ['priority'];

    render(<GroupActions columnKey='actions' onClose={mockOnClose} />);

    expect(getButton('Group by This').disabled).toBe(true);
    expect(getButton('Clear Grouping').disabled).toBe(true);
  });

  it('fires one grouping call per click, whatever else re-renders', () => {
    // The delegates read the applied key from the store, so a re-render is the
    // cheap way a render-path write would show up: the call count would climb
    // without any further interaction.
    const { rerender } = render(
      <GroupActions columnKey='order_status' onClose={mockOnClose} />,
    );

    rerender(<GroupActions columnKey='order_status' onClose={mockOnClose} />);
    rerender(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(mockSetGrouping).not.toHaveBeenCalled();

    fireEvent.click(getButton('Group by This'));

    rerender(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(mockSetGrouping).toHaveBeenCalledTimes(1);
  });
});
