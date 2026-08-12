// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

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

const { isGroupingEnabledRef } = vi.hoisted(() => ({
  isGroupingEnabledRef: { current: false },
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useSetColumnPinning: () => vi.fn(),
  useSetColumnSorting: () => vi.fn(),
  useSetColumnVisibility: () => vi.fn(),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/actions', () => ({
  useClearTableGrouping: () => vi.fn(),
  useSetTableColumnAggregate: () => vi.fn(),
  useToggleTableGroupKey: () => vi.fn(),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableColumnAggregate: () => {},
  useGetTableGroupingKeys: () => [],
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  // No capability resolved for this column, so the aggregation-mode block
  // renders nothing and the separator count below stays about grouping alone.
  useGetTableColumnGroupingCapability: () => {},
  useGetTableIsGroupingEnabled: () => isGroupingEnabledRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => ({ key: 'name', label: 'Name' }),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableColumnSelectedKey: () => vi.fn(),
  useSetTableDrawersOpenState: () => vi.fn(),
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
      // same column renders with grouping off.
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
