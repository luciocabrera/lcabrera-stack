// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type {
  TableAggregateFn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

const { MockTableActionsPopover } = vi.hoisted(() => ({
  MockTableActionsPopover: vi.fn(
    ({
      children,
    }: {
      readonly ariaLabel: string;
      readonly children: (ctx: { readonly closeMenu: () => void }) => ReactNode;
      readonly label: ReactNode;
    }) => <div>{children({ closeMenu: mockCloseMenu })}</div>,
  ),
}));

const mockCloseMenu = vi.fn();

const { NO_COLLAPSED_GROUP_PATHS, NO_ROWS } = vi.hoisted(() => ({
  NO_COLLAPSED_GROUP_PATHS: new Set<string>(),
  NO_ROWS: [] as readonly Record<string, unknown>[],
}));

const {
  appliedAggregatesRef,
  capabilityRef,
  groupingKeysRef,
  isGroupingEnabledRef,
} = vi.hoisted(() => ({
  appliedAggregatesRef: {
    current: [] as readonly { columnKey: string; fn: TableAggregateFn }[],
  },
  capabilityRef: {
    current: undefined as TableColumnGroupingCapability | undefined,
  },
  groupingKeysRef: { current: [] as readonly string[] },
  isGroupingEnabledRef: { current: false },
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useSetColumnPinning: () => vi.fn(),
  useSetColumnSorting: () => vi.fn(),
  useSetColumnVisibility: () => vi.fn(),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/actions', () => ({
  useAddTableColumnAggregate: () => vi.fn(),
  useClearTableGrouping: () => vi.fn(),
  useRemoveTableColumnAggregate: () => vi.fn(),
  useToggleTableGroupKey: () => vi.fn(),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableGroupingAggregates: () => appliedAggregatesRef.current,
  useGetTableGroupingKeys: () => groupingKeysRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  // Read from typed refs rather than spelled inline. Both hooks really answer
  // `X | undefined`, and the absent case is what the aggregation-mode block is
  // gated on — so the mock has to be able to express it *and* to be seen
  // expressing it. `() => undefined` is not an option: `unicorn/no-useless-undefined`
  // rewrites it to `() => {}`, an empty block that returns `undefined` and reads
  // like an empty object, which is exactly the confusion a reviewer hit.
  useGetTableColumnGroupingCapability: () => capabilityRef.current,
  useGetTableIsGroupingEnabled: () => isGroupingEnabledRef.current,
  useGetTableIsGroupingLocked: () => false,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => ({ key: 'name', label: 'Name' }),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableColumnSelectedKey: () => vi.fn(),
  useSetTableDrawersOpenState: () => vi.fn(),
}));

// The grouping section's fold-all pair reads the rows and the collapsed set to
// decide whether either action has anything to do. Neither is what this file
// asserts — it checks which sections the menu composes — so both are stubbed
// empty, which is also the state that renders them disabled.
vi.mock('#ui/components/Table/contexts/TableConfig/expansion/actions', () => ({
  useSetAllTableGroupsExpanded: () => vi.fn(),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/expansion/selectors',
  () => ({
    useGetTableCanDrillGroups: () => false,
    useGetTableCollapsedGroupPaths: () => NO_COLLAPSED_GROUP_PATHS,
  }),
);

vi.mock('#ui/components/Table/contexts/TableData/data/selectors', () => ({
  useGetTableData: () => NO_ROWS,
}));

vi.mock('#ui/components/Table/TableActionsPopover', () => ({
  TableActionsPopover: MockTableActionsPopover,
  TableActionsPopoverSeparator: () => <hr />,
  tableActionsPopoverStyles: {
    menuActions: {},
    menuIcon: {},
    menuItem: {},
  },
}));

import { TableHeaderActionsMenu } from './TableHeaderActionsMenu.component';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  appliedAggregatesRef.current = [];
  capabilityRef.current = undefined;
  groupingKeysRef.current = [];
  isGroupingEnabledRef.current = false;
});

describe('TableHeaderActionsMenu', () => {
  it('renders nothing when there is no sortable/pinnable/settings action', () => {
    const { container } = render(
      <TableHeaderActionsMenu
        columnKey='id'
        columnLabel='ID'
        hasSettings={false}
        isSortable={false}
        isStatic
      />,
    );

    expect(container.firstChild).toBeNull();
    expect(MockTableActionsPopover).not.toHaveBeenCalled();
  });

  it('renders only the sort section for a sortable static column without settings', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable
        isStatic
      />,
    );

    expect(screen.getByText('Ascending')).not.toBeNull();
    expect(screen.getByText('Descending')).not.toBeNull();
    expect(screen.queryByText('Pin Left')).toBeNull();
    expect(screen.queryByText('Pin Right')).toBeNull();
    expect(screen.queryByText('Hide Column')).toBeNull();
    expect(screen.queryByText('Manage Column')).toBeNull();
  });

  it('composes every section when the column is sortable, movable, and has settings', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings
        isSortable
        isStatic={false}
      />,
    );

    for (const label of [
      'Ascending',
      'Descending',
      'Clear Sorting',
      'Pin Left',
      'Pin Right',
      'Clear Pinning',
      'Hide Column',
      'Manage Column',
    ]) {
      expect(screen.getByText(label)).not.toBeNull();
    }
  });

  it('separates each rendered section from the one above it', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings
        isSortable
        isStatic={false}
      />,
    );

    // sort │ pin │ hide │ manage — three boundaries between four groups.
    expect(screen.getAllByRole('separator')).toHaveLength(3);
  });

  it('renders no leading separator when the sort section is absent', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable={false}
        isStatic={false}
      />,
    );

    // Only the pin │ hide boundary — nothing renders above "Pin Left".
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('renders no separator when a single section renders alone', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='id'
        columnLabel='ID'
        hasSettings
        isSortable={false}
        isStatic
      />,
    );

    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('renders only the pin/hide section for a movable non-sortable column', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable={false}
        isStatic={false}
      />,
    );

    expect(screen.getByText('Pin Left')).not.toBeNull();
    expect(screen.getByText('Pin Right')).not.toBeNull();
    expect(screen.getByText('Hide Column')).not.toBeNull();
    expect(screen.queryByText('Ascending')).toBeNull();
    expect(screen.queryByText('Manage Column')).toBeNull();
  });

  it('renders the Manage Column section when the column has settings', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='id'
        columnLabel='ID'
        hasSettings
        isSortable={false}
        isStatic
      />,
    );

    expect(screen.getByText('Manage Column')).not.toBeNull();
  });

  it('forwards closeMenu to the section subcomponents', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable
        isStatic
      />,
    );

    fireEvent.click(screen.getByText('Ascending'));

    expect(mockCloseMenu).toHaveBeenCalled();
  });

  it('passes a column-labeled ariaLabel/label to TableActionsPopover', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings
        isSortable
        isStatic={false}
      />,
    );

    expect(MockTableActionsPopover).toHaveBeenCalledWith(
      expect.objectContaining({
        ariaLabel: 'Name column actions',
        label: 'Name column actions',
      }),
      undefined,
    );
  });

  // Grouping is a *route* capability, so the menu reads it from the meta store
  // rather than taking it as a prop. Absent means off, which is why the menu a
  // non-grouping route renders is unchanged by this feature.
  describe('grouping section', () => {
    it('offers no grouping commands when the route did not declare the capability', () => {
      render(
        <TableHeaderActionsMenu
          columnKey='name'
          columnLabel='Name'
          hasSettings
          isSortable
          isStatic={false}
        />,
      );

      expect(screen.queryByText('Group by This')).toBeNull();
      expect(screen.queryByText('Clear Grouping')).toBeNull();
    });

    it('offers them when the route declared it', () => {
      isGroupingEnabledRef.current = true;

      render(
        <TableHeaderActionsMenu
          columnKey='name'
          columnLabel='Name'
          hasSettings
          isSortable
          isStatic={false}
        />,
      );

      expect(screen.getByText('Group by This')).not.toBeNull();
      expect(screen.getByText('Clear Grouping')).not.toBeNull();
    });

    it('separates the grouping section from the ones around it', () => {
      isGroupingEnabledRef.current = true;

      render(
        <TableHeaderActionsMenu
          columnKey='name'
          columnLabel='Name'
          hasSettings
          isSortable
          isStatic={false}
        />,
      );

      // sort │ group │ pin │ hide │ manage — four boundaries, one more than the
      // same column renders with grouping off. No capability is resolved for
      // this column, so the aggregation-mode block contributes none.
      expect(screen.getAllByRole('separator')).toHaveLength(4);
    });

    it('adds the aggregation-mode block only once a capability is resolved', () => {
      // The case the mock could not express while it answered a fixed value:
      // absent capability and present capability have to produce *different*
      // menus, or the suite cannot fail for the reason criterion 2 exists.
      isGroupingEnabledRef.current = true;
      capabilityRef.current = {
        aggregates: ['count', 'sum'],
        canGroup: false,
        column: 'name',
        periods: [],
        refusal: 'too-many-distinct',
        role: 'fact',
        typeName: 'numeric',
      };

      render(
        <TableHeaderActionsMenu
          columnKey='name'
          columnLabel='Name'
          hasSettings
          isSortable
          isStatic={false}
        />,
      );

      expect(screen.getByText('Sum')).not.toBeNull();
      expect(screen.getByText('Count')).not.toBeNull();
      expect(screen.getByText('No Aggregate')).not.toBeNull();
      // One more boundary than the absent-capability case above.
      expect(screen.getAllByRole('separator')).toHaveLength(5);
    });

    it('drops only the aggregation block once the column becomes a group key', () => {
      // The suppression is surgical: this is the same menu as the test above,
      // with the column applied as a key. Every other item has to survive it,
      // or the fix for #830 has taken the column's sort/pin/hide/manage
      // affordances down with the aggregates it meant to remove.
      isGroupingEnabledRef.current = true;
      capabilityRef.current = {
        aggregates: ['count', 'sum'],
        canGroup: false,
        column: 'name',
        periods: [],
        refusal: 'too-many-distinct',
        role: 'fact',
        typeName: 'numeric',
      };
      groupingKeysRef.current = ['name'];

      render(
        <TableHeaderActionsMenu
          columnKey='name'
          columnLabel='Name'
          hasSettings
          isSortable
          isStatic={false}
        />,
      );

      for (const label of [
        'Ascending',
        'Descending',
        'Clear Sorting',
        'Group by This',
        'Clear Grouping',
        'Expand All Groups',
        'Collapse All Groups',
        'Pin Left',
        'Pin Right',
        'Clear Pinning',
        'Hide Column',
        'Manage Column',
      ]) {
        expect(screen.getByText(label)).not.toBeNull();
      }

      expect(screen.queryByText('Sum')).toBeNull();
      expect(screen.queryByText('Count')).toBeNull();
      expect(screen.queryByText('No Aggregate')).toBeNull();
      // Back to the four boundaries the block-less grouping menu renders.
      expect(screen.getAllByRole('separator')).toHaveLength(4);
    });

    it('renders a trigger for a locked column that has nothing else to offer', () => {
      isGroupingEnabledRef.current = true;

      render(
        <TableHeaderActionsMenu
          columnKey='id'
          columnLabel='ID'
          hasSettings={false}
          isSortable={false}
          isStatic
        />,
      );

      expect(screen.getByText('Group by This')).not.toBeNull();
      expect(screen.queryByRole('separator')).toBeNull();
    });
  });
});
