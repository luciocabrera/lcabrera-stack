// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  mockSetColumnPinning,
  mockSetColumnVisibility,
  mockSetSorting,
  mockSetTableColumnSelectedKey,
  mockSetTableDrawersOpenState,
  MockTableActionsPopover,
} = vi.hoisted(() => ({
  mockSetColumnPinning: vi.fn(),
  mockSetColumnVisibility: vi.fn(),
  mockSetSorting: vi.fn(),
  mockSetTableColumnSelectedKey: vi.fn(),
  mockSetTableDrawersOpenState: vi.fn(),
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
  '@repo/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnPinning: () => mockSetColumnPinning,
    useSetColumnSorting: () => mockSetSorting,
    useSetColumnVisibility: () => mockSetColumnVisibility,
  }),
);

vi.mock('@repo/ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableColumnSelectedKey: () => mockSetTableColumnSelectedKey,
  useSetTableDrawersOpenState: () => mockSetTableDrawersOpenState,
}));

vi.mock('@repo/ui/components/Table/TableActionsPopover', () => ({
  TableActionsPopover: MockTableActionsPopover,
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

  it('shows Ascending/Descending but not Clear Sorting when no sort is applied', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable
        isStatic={false}
      />,
    );

    expect(screen.getByText('Ascending')).not.toBeNull();
    expect(screen.getByText('Descending')).not.toBeNull();
    expect(screen.queryByText('Clear Sorting')).toBeNull();
  });

  it('shows Clear Sorting when a sort is applied and clears it on click', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable
        isStatic={false}
        sortDirection='asc'
      />,
    );

    fireEvent.click(screen.getByText('Clear Sorting'));

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: undefined,
    });
    expect(mockCloseMenu).toHaveBeenCalled();
  });

  it('toggles Ascending off when it is already the active direction', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable
        isStatic={false}
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
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable
        isStatic={false}
      />,
    );

    fireEvent.click(screen.getByText('Descending'));

    expect(mockSetSorting).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: 'desc',
    });
  });

  it('hides Pin/Hide items for static columns', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='id'
        columnLabel='ID'
        hasSettings
        isSortable={false}
        isStatic
      />,
    );

    expect(screen.queryByText('Pin Left')).toBeNull();
    expect(screen.queryByText('Pin Right')).toBeNull();
    expect(screen.queryByText('Hide Column')).toBeNull();
    expect(screen.getByText('Manage Column')).not.toBeNull();
  });

  it('toggles Pin Left off when already pinned left', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable={false}
        isStatic={false}
        pinSide='left'
      />,
    );

    fireEvent.click(screen.getByText('Pin Left'));

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: undefined,
    });
  });

  it('pins right when not already pinned right', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable={false}
        isStatic={false}
      />,
    );

    fireEvent.click(screen.getByText('Pin Right'));

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: 'right',
    });
  });

  it('hides the column via useSetColumnVisibility', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings={false}
        isSortable={false}
        isStatic={false}
      />,
    );

    fireEvent.click(screen.getByText('Hide Column'));

    expect(mockSetColumnVisibility).toHaveBeenCalledWith({
      columnKey: 'name',
      isVisible: false,
    });
    expect(mockCloseMenu).toHaveBeenCalled();
  });

  it('opens the per-column settings drawer via Manage Column', () => {
    render(
      <TableHeaderActionsMenu
        columnKey='name'
        columnLabel='Name'
        hasSettings
        isSortable={false}
        isStatic={false}
      />,
    );

    fireEvent.click(screen.getByText('Manage Column'));

    expect(mockSetTableColumnSelectedKey).toHaveBeenCalledWith('name');
    expect(mockSetTableDrawersOpenState).toHaveBeenCalledWith({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
    });
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
