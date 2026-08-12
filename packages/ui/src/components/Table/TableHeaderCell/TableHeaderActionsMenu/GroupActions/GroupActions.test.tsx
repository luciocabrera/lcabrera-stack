// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumnGroupingCapability } from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

const {
  appliedAggregateRef,
  capabilityRef,
  groupingKeysRef,
  isGroupingEnabledRef,
  mockClearGrouping,
  mockSetColumnAggregate,
  mockToggleGroupKey,
  normalizedColumnRef,
} = vi.hoisted(() => ({
  appliedAggregateRef: { current: undefined as string | undefined },
  capabilityRef: { current: undefined as unknown },
  groupingKeysRef: { current: [] as readonly string[] },
  isGroupingEnabledRef: { current: true },
  mockClearGrouping: vi.fn(),
  mockSetColumnAggregate: vi.fn(),
  mockToggleGroupKey: vi.fn(),
  normalizedColumnRef: { current: {} as Record<string, unknown> },
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/actions', () => ({
  useClearTableGrouping: () => mockClearGrouping,
  useSetTableColumnAggregate: () => mockSetColumnAggregate,
  useToggleTableGroupKey: () => mockToggleGroupKey,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableColumnAggregate: () => appliedAggregateRef.current,
  useGetTableGroupingKeys: () => groupingKeysRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => normalizedColumnRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableColumnGroupingCapability: () => capabilityRef.current,
  useGetTableIsGroupingEnabled: () => isGroupingEnabledRef.current,
}));

vi.mock('#ui/components/Table/TableActionsPopover', () => ({
  TableActionsPopoverSeparator: () => <hr data-testid='separator' />,
  tableActionsPopoverStyles: { menuIcon: {}, menuItem: {} },
}));

import { GroupActions } from './GroupActions.component';

const mockOnClose = vi.fn();

const numericCapability: TableColumnGroupingCapability = {
  aggregates: ['avg', 'count', 'sum'],
  canGroup: false,
  column: 'total_amount',
  refusal: 'too-many-distinct',
  role: 'fact',
  typeName: 'numeric',
};

const getButton = (label: string) => {
  const button = screen.getByText(label).closest('button');

  if (button === null) throw new Error(`No button for "${label}"`);

  return button;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  appliedAggregateRef.current = undefined;
  capabilityRef.current = undefined;
  groupingKeysRef.current = [];
  isGroupingEnabledRef.current = true;
  normalizedColumnRef.current = {};
});

describe('GroupActions', () => {
  it('composes the group-by and clear-grouping delegates', () => {
    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(screen.getByText('Group by This')).not.toBeNull();
    expect(screen.getByText('Clear Grouping')).not.toBeNull();
  });

  it('applies the column as a group key and closes the menu', () => {
    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    fireEvent.click(getButton('Group by This'));

    expect(mockToggleGroupKey).toHaveBeenCalledWith('order_status');
    expect(mockToggleGroupKey).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('marks itself active and toggles off when it is an applied key', () => {
    groupingKeysRef.current = ['order_status'];

    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(getButton('Group by This').getAttribute('aria-pressed')).toBe(
      'true',
    );

    fireEvent.click(getButton('Group by This'));

    expect(mockToggleGroupKey).toHaveBeenCalledWith('order_status');
  });

  it('marks itself active when it is a *deeper* key, not only the first', () => {
    // The multi-key case, and the one a `keys[0]` check gets wrong: every level
    // below the outermost would read as unapplied.
    groupingKeysRef.current = ['priority', 'order_status'];

    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(getButton('Group by This').getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('stays inactive and enabled when another column is the applied key', () => {
    groupingKeysRef.current = ['priority'];

    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    const button = getButton('Group by This');

    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.disabled).toBe(false);
  });

  it('disables adding a key at the configured depth, but not removing one', () => {
    groupingKeysRef.current = Array.from(
      { length: MAX_TABLE_GROUP_KEYS },
      (_unused, index) => `key_${index}`,
    );

    const { rerender } = render(
      <GroupActions columnKey='order_status' onClose={mockOnClose} />,
    );

    expect(getButton('Group by This').disabled).toBe(true);

    // The same depth, but this column is one of the applied keys — so the click
    // would remove rather than add, and must stay available.
    groupingKeysRef.current = [
      'order_status',
      ...groupingKeysRef.current.slice(1),
    ];
    rerender(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(getButton('Group by This').disabled).toBe(false);
  });

  it('disables Clear Grouping until some column is grouped', () => {
    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(getButton('Clear Grouping').disabled).toBe(true);
  });

  it('clears whichever keys are applied, not only the one this column names', () => {
    groupingKeysRef.current = ['priority'];

    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(getButton('Clear Grouping').disabled).toBe(false);

    fireEvent.click(getButton('Clear Grouping'));

    expect(mockClearGrouping).toHaveBeenCalledTimes(1);
  });

  it('disables only Group by This for a column the table declares ungroupable', () => {
    // The two buttons ask different questions and must not share a predicate.
    // Grouping *by* this column depends on this column; clearing whole-table
    // grouping does not, so a menu opened on an ungroupable column is still a
    // way out of a grouped view. Sharing the gate here strands the user with no
    // route to clearing except finding a groupable column's menu.
    normalizedColumnRef.current = { isGroupable: false };
    groupingKeysRef.current = ['priority'];

    render(<GroupActions columnKey='notes' onClose={mockOnClose} />);

    expect(getButton('Group by This').disabled).toBe(true);
    expect(getButton('Clear Grouping').disabled).toBe(false);
  });

  it('clears grouping from an ungroupable column\u{2019}s menu', () => {
    normalizedColumnRef.current = { isGroupable: false };
    groupingKeysRef.current = ['priority'];

    render(<GroupActions columnKey='notes' onClose={mockOnClose} />);
    fireEvent.click(getButton('Clear Grouping'));

    expect(mockClearGrouping).toHaveBeenCalledTimes(1);
  });

  it('still disables clearing when the route cannot group at all', () => {
    // The one capability that legitimately disables it — and the reason
    // `isDisabled` reads a real value rather than a hardcoded `false`.
    isGroupingEnabledRef.current = false;
    groupingKeysRef.current = ['priority'];

    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

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

    expect(mockToggleGroupKey).not.toHaveBeenCalled();

    fireEvent.click(getButton('Group by This'));

    rerender(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    expect(mockToggleGroupKey).toHaveBeenCalledTimes(1);
  });

  describe('aggregation-mode commands', () => {
    it('offers nothing when the route resolved no capability for the column', () => {
      // Absent means "no aggregate is legal here", never "all of them are".
      render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

      expect(screen.queryByText('Sum')).toBeNull();
      expect(screen.queryByText('No Aggregate')).toBeNull();
    });

    it('offers exactly the functions the catalogue reports for the column', () => {
      capabilityRef.current = numericCapability;

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(screen.getByText('Sum')).not.toBeNull();
      expect(screen.getByText('Average')).not.toBeNull();
      expect(screen.getByText('Count')).not.toBeNull();
      // Never offered for this column: the catalogue did not report it. A menu
      // shaped from `dataType` could not tell the difference (#550).
      expect(screen.queryByText('Minimum')).toBeNull();
      expect(screen.queryByText('All True')).toBeNull();
    });

    it('offers nothing for a column the catalogue can aggregate in no way', () => {
      capabilityRef.current = {
        aggregates: [],
        canGroup: false,
        column: 'doc',
        refusal: 'not-a-dimension',
        role: 'unsupported',
        typeName: 'jsonb',
      } satisfies TableColumnGroupingCapability;

      render(<GroupActions columnKey='doc' onClose={mockOnClose} />);

      expect(screen.queryByText('Count')).toBeNull();
      expect(screen.queryByText('No Aggregate')).toBeNull();
    });

    it('applies the chosen function to this column and closes the menu', () => {
      capabilityRef.current = numericCapability;

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);
      fireEvent.click(getButton('Sum'));

      expect(mockSetColumnAggregate).toHaveBeenCalledWith({
        columnKey: 'total_amount',
        fn: 'sum',
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('marks the applied function active and toggles it off on a second click', () => {
      capabilityRef.current = numericCapability;
      appliedAggregateRef.current = 'sum';

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(getButton('Sum').getAttribute('aria-pressed')).toBe('true');
      expect(getButton('Average').getAttribute('aria-pressed')).toBe('false');

      fireEvent.click(getButton('Sum'));

      expect(mockSetColumnAggregate).toHaveBeenCalledWith({
        columnKey: 'total_amount',
        fn: undefined,
      });
    });

    it('disables No Aggregate until one is applied', () => {
      capabilityRef.current = numericCapability;

      const { rerender } = render(
        <GroupActions columnKey='total_amount' onClose={mockOnClose} />,
      );

      expect(getButton('No Aggregate').disabled).toBe(true);

      appliedAggregateRef.current = 'avg';
      rerender(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(getButton('No Aggregate').disabled).toBe(false);

      fireEvent.click(getButton('No Aggregate'));

      expect(mockSetColumnAggregate).toHaveBeenCalledWith({
        columnKey: 'total_amount',
        fn: undefined,
      });
    });
  });
});
