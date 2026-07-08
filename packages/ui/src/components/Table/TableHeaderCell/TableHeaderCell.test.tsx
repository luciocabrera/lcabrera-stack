// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  MockResizeHandle,
  MockTableHeaderActionsMenu,
  useGetColumnSizingMock,
  useGetNormalizedColumnMock,
} = vi.hoisted(() => ({
  MockResizeHandle: vi.fn(() => <button type='button'>Resize</button>),
  MockTableHeaderActionsMenu: vi.fn(() => <div>Menu</div>),
  useGetColumnSizingMock: vi.fn(),
  useGetNormalizedColumnMock: vi.fn(),
}));

vi.mock('../contexts/TableConfig/columns/selectors', () => ({
  useGetColumnSizing: useGetColumnSizingMock,
  useGetNormalizedColumn: useGetNormalizedColumnMock,
}));

vi.mock('./ResizeHandle', () => ({
  ResizeHandle: MockResizeHandle,
}));

vi.mock('./TableHeaderActionsMenu', () => ({
  TableHeaderActionsMenu: MockTableHeaderActionsMenu,
}));

import { TableHeaderCell } from './TableHeaderCell.component';

const createColumn = (overrides: Record<string, unknown> = {}) => ({
  isHeaderHidden: false,
  isResizable: true,
  isSortable: true,
  isStatic: false,
  key: 'name',
  label: 'Name',
  maxWidth: undefined,
  minWidth: undefined,
  sortDirection: undefined,
  ...overrides,
});

const renderCell = (
  props: Partial<Parameters<typeof TableHeaderCell>[0]> = {},
) =>
  render(
    <table>
      <thead>
        <tr>
          <TableHeaderCell columnKey='name' {...props} />
        </tr>
      </thead>
    </table>,
  );

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('TableHeaderCell', () => {
  it('renders the column label', () => {
    useGetColumnSizingMock.mockReturnValue({});
    useGetNormalizedColumnMock.mockReturnValue(createColumn());

    renderCell();

    expect(screen.getByText('Name')).not.toBeNull();
  });

  it('renders ResizeHandle when the column is resizable', () => {
    useGetColumnSizingMock.mockReturnValue({});
    useGetNormalizedColumnMock.mockReturnValue(createColumn());

    renderCell();

    expect(MockResizeHandle).toHaveBeenCalledWith(
      expect.objectContaining({
        columnKey: 'name',
        columnLabel: 'Name',
      }),
      undefined,
    );
  });

  it('omits ResizeHandle when the column is not resizable', () => {
    useGetColumnSizingMock.mockReturnValue({});
    useGetNormalizedColumnMock.mockReturnValue(
      createColumn({ isResizable: false }),
    );

    renderCell();

    expect(MockResizeHandle).not.toHaveBeenCalled();
  });

  it('forwards sort/pin/settings state to TableHeaderActionsMenu', () => {
    useGetColumnSizingMock.mockReturnValue({});
    useGetNormalizedColumnMock.mockReturnValue(
      createColumn({ isStatic: true, sortDirection: 'asc' }),
    );

    renderCell({
      hasSettings: true,
      pinInfo: {
        isFirstPinnedRight: false,
        isLastPinnedLeft: true,
        offset: 0,
        side: 'left',
      },
    });

    expect(MockTableHeaderActionsMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        columnKey: 'name',
        columnLabel: 'Name',
        hasSettings: true,
        isSortable: true,
        isStatic: true,
        pinSide: 'left',
        sortDirection: 'asc',
      }),
      undefined,
    );
  });

  it('shows the loading skeleton overlay when isLoadingState is true', () => {
    useGetColumnSizingMock.mockReturnValue({});
    useGetNormalizedColumnMock.mockReturnValue(createColumn());

    const { container } = renderCell({ isLoadingState: true });

    expect(container.querySelector('th > div')).not.toBeNull();
  });

  it('renders nothing but the skeleton when isHeaderHidden is true', () => {
    useGetColumnSizingMock.mockReturnValue({});
    useGetNormalizedColumnMock.mockReturnValue(
      createColumn({ isHeaderHidden: true }),
    );

    renderCell();

    expect(screen.queryByText('Name')).toBeNull();
    expect(MockResizeHandle).not.toHaveBeenCalled();
    expect(MockTableHeaderActionsMenu).not.toHaveBeenCalled();
  });
});
