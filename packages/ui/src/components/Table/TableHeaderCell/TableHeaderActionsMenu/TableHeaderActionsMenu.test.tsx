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

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnPinning: () => vi.fn(),
    useSetColumnSorting: () => vi.fn(),
    useSetColumnVisibility: () => vi.fn(),
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/actions',
  () => ({
    useSetTableColumnSelectedKey: () => vi.fn(),
    useSetTableDrawersOpenState: () => vi.fn(),
  }),
);

vi.mock('@lcabrera/ui/components/Table/TableActionsPopover', () => ({
  TableActionsPopover: MockTableActionsPopover,
  tableActionsPopoverStyles: {
    menuActions: {},
    menuIcon: {},
    menuItem: {},
    menuSectionDivider: {},
  },
}));

import { TableHeaderActionsMenu } from './TableHeaderActionsMenu.component';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
});
