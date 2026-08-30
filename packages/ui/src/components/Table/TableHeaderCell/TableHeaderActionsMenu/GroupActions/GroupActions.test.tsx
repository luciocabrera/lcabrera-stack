// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumnGroupingCapability } from '#ui/components/Table/Table.types';

import {
  MAX_TABLE_GROUP_KEYS,
  TABLE_GROUP_ROW_FIELD,
} from '#ui/components/Table/Table.constants';

const {
  appliedAggregatesRef,
  capabilityRef,
  collapsedGroupPathsRef,
  dataRef,
  groupingKeysRef,
  isGroupingEnabledRef,
  isGroupingLockedRef,
  mockAddColumnAggregate,
  mockClearGrouping,
  mockRemoveColumnAggregate,
  mockSetAllGroupsExpanded,
  mockSetGroupLevelExpanded,
  mockToggleGroupKey,
  normalizedColumnRef,
} = vi.hoisted(() => ({
  appliedAggregatesRef: {
    current: [] as readonly { columnKey: string; fn: string }[],
  },
  capabilityRef: { current: undefined as unknown },
  collapsedGroupPathsRef: { current: new Set<string>() },
  dataRef: { current: [] as readonly Record<string, unknown>[] },

  groupingKeysRef: { current: [] as readonly string[] },
  isGroupingEnabledRef: { current: true },
  isGroupingLockedRef: { current: false },
  mockAddColumnAggregate: vi.fn(),
  mockClearGrouping: vi.fn(),
  mockRemoveColumnAggregate: vi.fn(),
  mockSetAllGroupsExpanded: vi.fn(),
  mockSetGroupLevelExpanded: vi.fn(),
  mockToggleGroupKey: vi.fn(),
  normalizedColumnRef: { current: {} as Record<string, unknown> },
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/actions', () => ({
  useAddTableColumnAggregate: () => mockAddColumnAggregate,
  useClearTableGrouping: () => mockClearGrouping,
  useRemoveTableColumnAggregate: () => mockRemoveColumnAggregate,
  useToggleTableGroupKey: () => mockToggleGroupKey,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableGroupingAggregates: () => appliedAggregatesRef.current,
  useGetTableGroupingKeys: () => groupingKeysRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => normalizedColumnRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableColumnGroupingCapability: () => capabilityRef.current,
  useGetTableIsGroupingEnabled: () => isGroupingEnabledRef.current,
  useGetTableIsGroupingLocked: () => isGroupingLockedRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/expansion/actions', () => ({
  useSetAllTableGroupsExpanded: () => mockSetAllGroupsExpanded,
  useSetTableGroupLevelExpanded: () => mockSetGroupLevelExpanded,
}));

// The fold-all pair derives its enabled state from the same group tree the body
// paints, so the whole expansion selector surface has to resolve — not only the
// collapsed set the assertions vary.
vi.mock(
  '#ui/components/Table/contexts/TableConfig/expansion/selectors',
  () => ({
    useGetTableCanDrillGroups: () => false,
    useGetTableCollapsedGroupPaths: () => collapsedGroupPathsRef.current,
  }),
);

vi.mock('#ui/components/Table/contexts/TableData/data/selectors', () => ({
  useGetTableData: () => dataRef.current,
}));

vi.mock('#ui/components/Table/TableActionsPopover', () => ({
  TableActionsPopoverSeparator: () => <hr data-testid='separator' />,
  tableActionsPopoverStyles: { menuIcon: {}, menuItem: {} },
}));

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import { GroupActions } from './GroupActions.component';

const mockOnClose = vi.fn();

const numericCapability: TableColumnGroupingCapability = {
  aggregates: ['avg', 'count', 'sum'],
  canGroup: false,
  column: 'total_amount',
  periods: [],
  refusal: 'too-many-distinct',
  role: 'fact',
  typeName: 'numeric',
};

/** A dimension the catalogue offers both count flavours on. */
const textCapability: TableColumnGroupingCapability = {
  aggregates: ['count', 'countDistinct'],
  canGroup: true,
  column: 'order_status',
  periods: [],
  role: 'dimension',
  typeName: 'text',
};

const GROUP_FIXTURE_KEYS = ['city', 'status'];

const pathOf = (...labels: readonly string[]) =>
  labels.map((label, index) => ({
    columnKey: GROUP_FIXTURE_KEYS[index] ?? 'status',
    label,
    value: label,
  }));

type GroupRowArgs = {
  readonly isSubtotal?: boolean;
  readonly path: ReturnType<typeof pathOf>;
};

const groupRow = ({
  isSubtotal = false,
  path,
}: GroupRowArgs): Record<string, unknown> => ({
  [TABLE_GROUP_ROW_FIELD]: { aggregates: [], count: 2, isSubtotal, path },
});

/** A rollup block: the deepest row, then the subtotal that totals it (#570). */
const rollupRows = [
  groupRow({ path: pathOf('Berlin', 'Open') }),
  groupRow({ isSubtotal: true, path: pathOf('Berlin') }),
];

const getButton = (label: string) => {
  const button = screen.getByText(label).closest('button');

  if (button === null) throw new Error(`No button for "${label}"`);

  return button;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  appliedAggregatesRef.current = [];
  capabilityRef.current = undefined;
  collapsedGroupPathsRef.current = new Set<string>();
  dataRef.current = [];
  groupingKeysRef.current = [];
  isGroupingEnabledRef.current = true;
  isGroupingLockedRef.current = false;
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

    expect(mockToggleGroupKey).toHaveBeenCalledWith({
      columnKey: 'order_status',
      period: undefined,
    });
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

    expect(mockToggleGroupKey).toHaveBeenCalledWith({
      columnKey: 'order_status',
      period: undefined,
    });
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

  it('disables Group by This for a column the catalogue refuses, and says why', () => {
    // The defect: `isGroupable` defaults to true, so every column the endpoint
    // refuses was still offered as a group key, and picking one emptied the
    // table (#642). The declared flag is untouched here — the catalogue is the
    // only thing saying no.
    capabilityRef.current = numericCapability;

    render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

    const button = getButton('Group by This');

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('title')).toBe(
      'Cannot group by this column: it holds too many distinct values — filter the table down first.',
    );

    fireEvent.click(button);

    expect(mockToggleGroupKey).not.toHaveBeenCalled();
  });

  it('still removes a refused key that is already applied, and explains nothing there', () => {
    // A URL can seed a grouping the catalogue refuses today (ADR-061), so the
    // one item that can undo it must not be disabled by that same refusal — and
    // must not explain it either: this click *removes* the grouping, so "Cannot
    // group by this column" would describe an action nobody is taking.
    capabilityRef.current = numericCapability;
    groupingKeysRef.current = ['total_amount'];

    render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

    const button = getButton('Group by This');

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('title')).toBeNull();

    fireEvent.click(button);

    expect(mockToggleGroupKey).toHaveBeenCalledWith({
      columnKey: 'total_amount',
      period: undefined,
    });
  });

  it('quotes no catalogue reason for a column the table itself declared ungroupable', () => {
    // Two different facts, and only one of them is the endpoint's. A column the
    // consumer hid from grouping is off the menu because the table said so, so
    // quoting the catalogue's distinct-value reason would blame the wrong party
    // for a decision the user cannot act on.
    capabilityRef.current = numericCapability;
    normalizedColumnRef.current = { isGroupable: false };

    render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

    const button = getButton('Group by This');

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('title')).toBeNull();
  });

  it('leaves the column offered when the route resolved no capability for it', () => {
    // Absence is "nobody asked": a route may group without shipping a
    // capability map, and reading absence as a refusal would switch it off.
    render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

    const button = getButton('Group by This');

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('title')).toBeNull();
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

    it('offers nothing at all while the column is an applied group key', () => {
      // The same capability that offers three functions above offers none here,
      // so it is the key membership doing the work and not the type. A grouped
      // column renders its key's value rather than a measure (ADR-080), so the
      // click wrote the grouping store and changed nothing on screen (#830).
      capabilityRef.current = numericCapability;
      groupingKeysRef.current = ['total_amount'];

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(screen.queryByText('Sum')).toBeNull();
      expect(screen.queryByText('Average')).toBeNull();
      expect(screen.queryByText('Count')).toBeNull();
      // The clear item goes with them: "nothing to offer" has one exit.
      expect(screen.queryByText('No Aggregate')).toBeNull();
      expect(screen.queryByTestId('separator')).toBeNull();
    });

    it('leaves the rest of the grouping section untouched by that suppression', () => {
      capabilityRef.current = numericCapability;
      groupingKeysRef.current = ['total_amount'];

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(screen.getByText('Group by This')).not.toBeNull();
      expect(screen.getByText('Clear Grouping')).not.toBeNull();
      expect(screen.getByText('Expand All Groups')).not.toBeNull();
      expect(screen.getByText('Collapse All Groups')).not.toBeNull();
    });

    it('restores the functions when the column leaves the grouping', () => {
      capabilityRef.current = numericCapability;
      groupingKeysRef.current = ['total_amount'];

      const { rerender } = render(
        <GroupActions columnKey='total_amount' onClose={mockOnClose} />,
      );

      expect(screen.queryByText('Sum')).toBeNull();

      groupingKeysRef.current = [];
      rerender(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(screen.getByText('Sum')).not.toBeNull();
      expect(screen.getByText('Average')).not.toBeNull();
      expect(screen.getByText('Count')).not.toBeNull();
      expect(screen.getByText('No Aggregate')).not.toBeNull();
    });

    it('is unmoved when a *different* column joins or leaves the grouping', () => {
      // The condition is "this column is a key", not "the table is grouped" —
      // a predicate reading the key list's length would pass the test above and
      // fail this one.
      capabilityRef.current = numericCapability;
      groupingKeysRef.current = ['priority'];

      const { rerender } = render(
        <GroupActions columnKey='total_amount' onClose={mockOnClose} />,
      );

      expect(screen.getByText('Sum')).not.toBeNull();

      groupingKeysRef.current = [];
      rerender(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(screen.getByText('Sum')).not.toBeNull();
      expect(screen.getByText('No Aggregate')).not.toBeNull();
    });

    it('offers nothing for a column the catalogue can aggregate in no way', () => {
      capabilityRef.current = {
        aggregates: [],
        canGroup: false,
        column: 'doc',
        periods: [],
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

      expect(mockAddColumnAggregate).toHaveBeenCalledWith({
        columnKey: 'total_amount',
        fn: 'sum',
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('adds a second function beside the one already applied', () => {
      // The header half of #831: choosing `count` on a column carrying `avg`
      // used to swap them, and the earlier selection vanished with no message.
      capabilityRef.current = numericCapability;
      appliedAggregatesRef.current = [{ columnKey: 'total_amount', fn: 'avg' }];

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);
      fireEvent.click(getButton('Count'));

      expect(mockAddColumnAggregate).toHaveBeenCalledWith({
        columnKey: 'total_amount',
        fn: 'count',
      });
      expect(mockRemoveColumnAggregate).not.toHaveBeenCalled();
    });

    it('marks the applied function active and toggles it off on a second click', () => {
      capabilityRef.current = numericCapability;
      appliedAggregatesRef.current = [{ columnKey: 'total_amount', fn: 'sum' }];

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(getButton('Sum').getAttribute('aria-pressed')).toBe('true');
      expect(getButton('Average').getAttribute('aria-pressed')).toBe('false');

      fireEvent.click(getButton('Sum'));

      expect(mockRemoveColumnAggregate).toHaveBeenCalledWith({
        columnKey: 'total_amount',
        fn: 'sum',
      });
    });

    it('marks SEVERAL functions active at once on one column', () => {
      // The state a toggle derivation cannot express, which is why aggregates
      // got their own beside the shared one (#831).
      capabilityRef.current = numericCapability;
      appliedAggregatesRef.current = [
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'avg' },
      ];

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(getButton('Sum').getAttribute('aria-pressed')).toBe('true');
      expect(getButton('Average').getAttribute('aria-pressed')).toBe('true');
      expect(getButton('Count').getAttribute('aria-pressed')).toBe('false');
    });

    it('reads the pressed state per column, not per table', () => {
      capabilityRef.current = numericCapability;
      appliedAggregatesRef.current = [{ columnKey: 'quantity', fn: 'sum' }];

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(getButton('Sum').getAttribute('aria-pressed')).toBe('false');
    });

    it('disables No Aggregate until one is applied', () => {
      capabilityRef.current = numericCapability;

      const { rerender } = render(
        <GroupActions columnKey='total_amount' onClose={mockOnClose} />,
      );

      expect(getButton('No Aggregate').disabled).toBe(true);

      appliedAggregatesRef.current = [{ columnKey: 'total_amount', fn: 'avg' }];
      rerender(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(getButton('No Aggregate').disabled).toBe(false);

      fireEvent.click(getButton('No Aggregate'));

      // No function named: "No Aggregate" clears every measure on the column,
      // not only the last one chosen.
      expect(mockRemoveColumnAggregate).toHaveBeenCalledWith({
        columnKey: 'total_amount',
      });
    });

    it('withholds a second Distinct Count while keeping the one that carries it', () => {
      // Both halves in one test on purpose (#842): a rule that withheld the
      // function everywhere would pass the first assertion and strand the user
      // with a distinct count they cannot clear from the menu it was applied
      // from — this menu toggles, so that item is the only way off.
      capabilityRef.current = textCapability;
      appliedAggregatesRef.current = [
        { columnKey: 'order_status', fn: 'countDistinct' },
      ];

      const { unmount } = render(
        <GroupActions columnKey='total_amount' onClose={mockOnClose} />,
      );

      expect(screen.queryByText('Distinct Count')).toBeNull();
      // The rest of the same capability is untouched, so it is the budget doing
      // the work and not the column falling out of the menu altogether.
      expect(screen.getByText('Count')).not.toBeNull();
      expect(screen.getByText('No Aggregate')).not.toBeNull();

      unmount();
      render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

      expect(getButton('Distinct Count').getAttribute('aria-pressed')).toBe(
        'true',
      );

      fireEvent.click(getButton('Distinct Count'));

      expect(mockRemoveColumnAggregate).toHaveBeenCalledWith({
        columnKey: 'order_status',
        fn: 'countDistinct',
      });
    });

    it('offers it again on every column once it is cleared', () => {
      capabilityRef.current = textCapability;
      appliedAggregatesRef.current = [
        { columnKey: 'order_status', fn: 'countDistinct' },
      ];

      const { rerender } = render(
        <GroupActions columnKey='total_amount' onClose={mockOnClose} />,
      );

      expect(screen.queryByText('Distinct Count')).toBeNull();

      appliedAggregatesRef.current = [];
      rerender(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(getButton('Distinct Count').getAttribute('aria-pressed')).toBe(
        'false',
      );
    });

    it('is unmoved by another column carrying an aggregate that is not a distinct count', () => {
      // The discriminating half: the withholding above is about `countDistinct`
      // and the read's budget for it, not about the column being measured at
      // all.
      capabilityRef.current = textCapability;
      appliedAggregatesRef.current = [
        { columnKey: 'order_status', fn: 'count' },
      ];

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(screen.getByText('Distinct Count')).not.toBeNull();
    });
  });
  describe('folding every group at once', () => {
    it('composes the fold pair alongside the whole-table clear', () => {
      render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

      expect(screen.getByText('Expand All Groups')).not.toBeNull();
      expect(screen.getByText('Collapse All Groups')).not.toBeNull();
    });

    it('offers neither on a grid with no groups in it', () => {
      render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

      expect(getButton('Expand All Groups').disabled).toBe(true);
      expect(getButton('Collapse All Groups').disabled).toBe(true);
    });

    it('collapses every group and closes the menu', () => {
      dataRef.current = rollupRows;
      groupingKeysRef.current = ['city', 'status'];

      render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

      const button = getButton('Collapse All Groups');

      expect(button.disabled).toBe(false);

      fireEvent.click(button);

      expect(mockSetAllGroupsExpanded).toHaveBeenCalledWith(false);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('stops offering the collapse once every foldable group is folded', () => {
      dataRef.current = rollupRows;
      groupingKeysRef.current = ['city', 'status'];
      collapsedGroupPathsRef.current = new Set([
        resolveGroupPathKey(pathOf('Berlin')),
      ]);

      render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

      expect(getButton('Collapse All Groups').disabled).toBe(true);
    });

    it('offers the expand only while something is collapsed, and closes on it', () => {
      dataRef.current = rollupRows;
      groupingKeysRef.current = ['city', 'status'];
      collapsedGroupPathsRef.current = new Set([
        resolveGroupPathKey(pathOf('Berlin')),
      ]);

      render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

      fireEvent.click(getButton('Expand All Groups'));

      expect(mockSetAllGroupsExpanded).toHaveBeenCalledWith(true);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('offers no collapse under `flat`, where a fold could not be undone', () => {
      // The same two key columns, without the subtotal that renders `(Berlin)`.
      // Folding it there hides every row of the group and leaves nothing behind
      // to reopen it from, so the grid must not offer it at all (#774).
      dataRef.current = [
        groupRow({ path: pathOf('Berlin', 'Open') }),
        groupRow({ path: pathOf('Berlin', 'Shut') }),
      ];
      groupingKeysRef.current = ['city', 'status'];

      render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

      expect(getButton('Collapse All Groups').disabled).toBe(true);
    });
  });

  describe('folding one level from its column', () => {
    it('offers both actions on every applied group key', () => {
      dataRef.current = rollupRows;
      groupingKeysRef.current = GROUP_FIXTURE_KEYS;

      const outermost = render(
        <GroupActions columnKey='city' onClose={mockOnClose} />,
      );

      expect(screen.getByText('Expand This Level')).not.toBeNull();
      expect(screen.getByText('Collapse This Level')).not.toBeNull();
      outermost.unmount();

      render(<GroupActions columnKey='status' onClose={mockOnClose} />);

      expect(screen.getByText('Expand This Level')).not.toBeNull();
      expect(screen.getByText('Collapse This Level')).not.toBeNull();
    });

    it('offers neither on a column that is not a group key', () => {
      dataRef.current = rollupRows;
      groupingKeysRef.current = GROUP_FIXTURE_KEYS;

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(screen.queryByText('Expand This Level')).toBeNull();
      expect(screen.queryByText('Collapse This Level')).toBeNull();
    });

    it('leaves both inert on the innermost key, whose groups own no rows', () => {
      dataRef.current = rollupRows;
      groupingKeysRef.current = GROUP_FIXTURE_KEYS;

      render(<GroupActions columnKey='status' onClose={mockOnClose} />);

      expect(getButton('Collapse This Level').disabled).toBe(true);
      expect(getButton('Expand This Level').disabled).toBe(true);
    });

    it('leaves both inert under `flat`, where a fold could not be undone', () => {
      dataRef.current = [
        groupRow({ path: pathOf('Berlin', 'Open') }),
        groupRow({ path: pathOf('Berlin', 'Shut') }),
      ];
      groupingKeysRef.current = GROUP_FIXTURE_KEYS;

      render(<GroupActions columnKey='city' onClose={mockOnClose} />);

      expect(getButton('Collapse This Level').disabled).toBe(true);
      expect(getButton('Expand This Level').disabled).toBe(true);
    });

    it('leaves the whole-table pair standing wherever the level pair is not', () => {
      dataRef.current = rollupRows;
      groupingKeysRef.current = GROUP_FIXTURE_KEYS;

      render(<GroupActions columnKey='total_amount' onClose={mockOnClose} />);

      expect(screen.getByText('Expand All Groups')).not.toBeNull();
      expect(screen.getByText('Collapse All Groups')).not.toBeNull();
    });

    it('folds this column\u{2019}s level and closes the menu', () => {
      dataRef.current = rollupRows;
      groupingKeysRef.current = GROUP_FIXTURE_KEYS;

      render(<GroupActions columnKey='city' onClose={mockOnClose} />);

      const button = getButton('Collapse This Level');

      expect(button.disabled).toBe(false);

      fireEvent.click(button);

      expect(mockSetGroupLevelExpanded).toHaveBeenCalledWith({
        columnKey: 'city',
        isExpanded: false,
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('stops offering the collapse once this level is folded', () => {
      dataRef.current = rollupRows;
      groupingKeysRef.current = GROUP_FIXTURE_KEYS;
      collapsedGroupPathsRef.current = new Set([
        resolveGroupPathKey(pathOf('Berlin')),
      ]);

      render(<GroupActions columnKey='city' onClose={mockOnClose} />);

      expect(getButton('Collapse This Level').disabled).toBe(true);
    });

    it('offers the expand only while this level is folded, and closes on it', () => {
      dataRef.current = rollupRows;
      groupingKeysRef.current = GROUP_FIXTURE_KEYS;

      const { rerender } = render(
        <GroupActions columnKey='city' onClose={mockOnClose} />,
      );

      expect(getButton('Expand This Level').disabled).toBe(true);

      collapsedGroupPathsRef.current = new Set([
        resolveGroupPathKey(pathOf('Berlin')),
      ]);
      rerender(<GroupActions columnKey='city' onClose={mockOnClose} />);

      fireEvent.click(getButton('Expand This Level'));

      expect(mockSetGroupLevelExpanded).toHaveBeenCalledWith({
        columnKey: 'city',
        isExpanded: true,
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('a locked preset', () => {
    it('offers neither Group by This nor Clear Grouping', () => {
      // The drawer's picker is not the only surface that reshapes a grouping —
      // this menu does it too, so a lock honoured in one and ignored in the
      // other is not a lock (#578).
      isGroupingLockedRef.current = true;
      normalizedColumnRef.current = { isGroupable: true, key: 'order_status' };
      groupingKeysRef.current = ['order_status'];

      render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

      expect(
        screen.queryByRole('button', { name: 'Group by This' }),
      ).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Clear Grouping' }),
      ).toBeNull();
    });

    it('still offers the aggregate commands, which measure rather than group', () => {
      // The lock covers the grouping shape, not what is measured over it.
      isGroupingLockedRef.current = true;
      normalizedColumnRef.current = { isGroupable: true, key: 'total_amount' };
      capabilityRef.current = {
        aggregates: ['sum'],
        canGroup: true,
        column: 'total_amount',
        periods: [],
        role: 'fact',
        typeName: 'numeric',
      } satisfies TableColumnGroupingCapability;

      render(<GroupActions columnKey='order_status' onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /Sum/ })).toBeTruthy();
    });
  });
});
