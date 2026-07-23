// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const {
  MockResizeHandle,
  MockTableHeaderActionsMenu,
  useGetColumnWidthMock,
  useGetNormalizedColumnMock,
  useGetPinnedColumnInfoMock,
} = vi.hoisted(() => ({
  MockResizeHandle: vi.fn(() => <button type='button'>Resize</button>),
  MockTableHeaderActionsMenu: vi.fn(() => <div>Menu</div>),
  useGetColumnWidthMock: vi.fn(),
  useGetNormalizedColumnMock: vi.fn(),
  useGetPinnedColumnInfoMock: vi.fn(),
}));

vi.mock('../contexts/TableConfig/columns/selectors', () => ({
  useGetColumnWidth: useGetColumnWidthMock,
  useGetNormalizedColumn: useGetNormalizedColumnMock,
  useGetPinnedColumnInfo: useGetPinnedColumnInfoMock,
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
    useGetColumnWidthMock.mockReturnValue(undefined);
    useGetPinnedColumnInfoMock.mockReturnValue(undefined);
    useGetNormalizedColumnMock.mockReturnValue(createColumn());

    renderCell();

    expect(screen.getByText('Name')).not.toBeNull();
  });

  it('renders ResizeHandle when the column is resizable', () => {
    useGetColumnWidthMock.mockReturnValue(undefined);
    useGetPinnedColumnInfoMock.mockReturnValue(undefined);
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
    useGetColumnWidthMock.mockReturnValue(undefined);
    useGetPinnedColumnInfoMock.mockReturnValue(undefined);
    useGetNormalizedColumnMock.mockReturnValue(
      createColumn({ isResizable: false }),
    );

    renderCell();

    expect(MockResizeHandle).not.toHaveBeenCalled();
  });

  it('forwards sort/pin/settings state to TableHeaderActionsMenu', () => {
    useGetColumnWidthMock.mockReturnValue(undefined);
    useGetPinnedColumnInfoMock.mockReturnValue({
      isFirstPinnedRight: false,
      isLastPinnedLeft: true,
      offset: 0,
      side: 'left',
    });
    useGetNormalizedColumnMock.mockReturnValue(
      createColumn({ isStatic: true, sortDirection: 'asc' }),
    );

    renderCell({
      hasSettings: true,
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
    useGetColumnWidthMock.mockReturnValue(undefined);
    useGetPinnedColumnInfoMock.mockReturnValue(undefined);
    useGetNormalizedColumnMock.mockReturnValue(createColumn());

    const { container } = renderCell({ isLoadingState: true });

    expect(container.querySelector(':scope th > div')).not.toBeNull();
  });

  it('renders nothing but the skeleton when isHeaderHidden is true', () => {
    useGetColumnWidthMock.mockReturnValue(undefined);
    useGetPinnedColumnInfoMock.mockReturnValue(undefined);
    useGetNormalizedColumnMock.mockReturnValue(
      createColumn({ isHeaderHidden: true }),
    );

    renderCell();

    expect(screen.queryByText('Name')).toBeNull();
    expect(MockResizeHandle).not.toHaveBeenCalled();
    expect(MockTableHeaderActionsMenu).not.toHaveBeenCalled();
  });
});
