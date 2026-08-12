// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

import { TableBodyRows } from './TableBodyRows.component';

type MockTableBodyCellProps = {
  readonly children?: ReactNode;
  readonly isLoadingState?: boolean;
  readonly label?: string;
  readonly value?: unknown;
};

const formatMockCellValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return '';
};

const {
  useGetColumnSizingMock,
  useGetColumnsMock,
  useGetPinnedColumnOffsetsMock,
  useGetPinnedColumnPartitionMock,
  useGetTableDataMock,
} = vi.hoisted(() => ({
  useGetColumnSizingMock: vi.fn(),
  useGetColumnsMock: vi.fn(),
  useGetPinnedColumnOffsetsMock: vi.fn(),
  useGetPinnedColumnPartitionMock: vi.fn(),
  useGetTableDataMock: vi.fn(),
}));

const MockTableBodyCell = vi.hoisted(() => {
  return function MockTableBodyCell({
    children,
    label,
    value,
  }: MockTableBodyCellProps) {
    return (
      <td>
        {children ??
          `${formatMockCellValue(label)}:${formatMockCellValue(value)}`}
      </td>
    );
  };
});

const MockTableRow = vi.hoisted(() => {
  return function MockTableRow({ children }: { readonly children: ReactNode }) {
    return <tr>{children}</tr>;
  };
});

const MockTableGroupHeaderRow = vi.hoisted(() => {
  return function MockTableGroupHeaderRow({
    summary,
  }: {
    readonly summary: { readonly count: number; readonly label: string };
  }) {
    return (
      <tr>
        <td>{`group:${summary.label}:${summary.count}`}</td>
      </tr>
    );
  };
});

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetColumns: useGetColumnsMock,
  useGetColumnSizing: useGetColumnSizingMock,
  useGetPinnedColumnOffsets: useGetPinnedColumnOffsetsMock,
  useGetPinnedColumnPartition: useGetPinnedColumnPartitionMock,
}));

vi.mock('#ui/components/Table/TableBodyCell', () => ({
  TableBodyCell: MockTableBodyCell,
}));

vi.mock('#ui/components/Table/TableRow', () => ({
  TableRow: MockTableRow,
}));

vi.mock('#ui/components/Table/TableGroupHeaderRow', () => ({
  TableGroupHeaderRow: MockTableGroupHeaderRow,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableData: useGetTableDataMock,
}));

const setupDefaultMocks = () => {
  useGetPinnedColumnPartitionMock.mockReturnValue({
    centerCols: [
      { key: 'name', label: 'Name' },
      { key: 'amount', label: 'Amount' },
    ],
    leftPinnedCols: [],
    rightPinnedCols: [],
  });
  useGetColumnsMock.mockReturnValue([
    { key: 'name', label: 'Name' },
    { key: 'amount', label: 'Amount' },
  ]);
  useGetColumnSizingMock.mockReturnValue({});
  useGetPinnedColumnOffsetsMock.mockReturnValue({});
  useGetTableDataMock.mockReturnValue([
    { amount: 10, name: 'A' },
    { amount: 20, name: 'B' },
    { amount: 30, name: 'C' },
  ]);
};

describe('TableBodyRows', () => {
  afterEach(cleanup);

  it('renders visible rows from startIndex to endIndex', () => {
    setupDefaultMocks();

    render(
      <table>
        <tbody>
          <TableBodyRows endIndex={2} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('Name:A').textContent).toBe('Name:A');
    expect(screen.getByText('Amount:10').textContent).toBe('Amount:10');
    expect(screen.getByText('Name:B').textContent).toBe('Name:B');
    expect(screen.queryByText('Name:C')).toBeNull();
  });

  it('uses custom column render when provided', () => {
    useGetPinnedColumnPartitionMock.mockReturnValue({
      centerCols: [
        {
          key: 'name',
          label: 'Name',
          render: (row: Record<string, unknown>) =>
            `custom:${formatMockCellValue(row.name)}`,
        },
      ],
      leftPinnedCols: [],
      rightPinnedCols: [],
    });
    useGetColumnsMock.mockReturnValue([{ key: 'name', label: 'Name' }]);
    useGetColumnSizingMock.mockReturnValue({});
    useGetPinnedColumnOffsetsMock.mockReturnValue({});
    useGetTableDataMock.mockReturnValue([{ name: 'Z' }]);

    render(
      <table>
        <tbody>
          <TableBodyRows endIndex={1} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('custom:Z').textContent).toBe('custom:Z');
  });

  it('renders cells for pinned and center column groups', () => {
    useGetPinnedColumnPartitionMock.mockReturnValue({
      centerCols: [{ key: 'name', label: 'Name' }],
      leftPinnedCols: [{ key: 'id', label: 'ID' }],
      rightPinnedCols: [{ key: 'status', label: 'Status' }],
    });
    useGetColumnsMock.mockReturnValue([
      { isPrimaryKey: true, key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
    ]);
    useGetColumnSizingMock.mockReturnValue({});
    useGetPinnedColumnOffsetsMock.mockReturnValue({});
    useGetTableDataMock.mockReturnValue([
      { id: 1, name: 'A', status: 'active' },
    ]);

    render(
      <table>
        <tbody>
          <TableBodyRows endIndex={1} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('ID:1')).toBeTruthy();
    expect(screen.getByText('Name:A')).toBeTruthy();
    expect(screen.getByText('Status:active')).toBeTruthy();
  });

  it('keys rows by primary-key identity, so a reorder moves the row node', () => {
    useGetPinnedColumnPartitionMock.mockReturnValue({
      centerCols: [{ key: 'name', label: 'Name' }],
      leftPinnedCols: [],
      rightPinnedCols: [],
    });
    useGetColumnsMock.mockReturnValue([
      { isPrimaryKey: true, key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ]);
    useGetColumnSizingMock.mockReturnValue({});
    useGetPinnedColumnOffsetsMock.mockReturnValue({});
    useGetTableDataMock.mockReturnValue([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]);

    const { container, rerender } = render(
      <table>
        <tbody>
          <TableBodyRows endIndex={2} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    const rowNodeForA = container.querySelector('tr');

    expect(rowNodeForA?.textContent).toBe('Name:A');

    useGetTableDataMock.mockReturnValue([
      { id: 2, name: 'B' },
      { id: 1, name: 'A' },
    ]);

    rerender(
      <table>
        <tbody>
          <TableBodyRows endIndex={2} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    const reorderedRowNodes = container.querySelectorAll('tr');

    expect(reorderedRowNodes).toHaveLength(2);
    expect(reorderedRowNodes[1]?.textContent).toBe('Name:A');
    expect(reorderedRowNodes[1]).toBe(rowNodeForA);
  });

  it('renders a row carrying a group summary as a group header, not as cells', () => {
    setupDefaultMocks();
    useGetTableDataMock.mockReturnValue([
      {
        [TABLE_GROUP_ROW_FIELD]: {
          columnKey: 'name',
          count: 3,
          label: 'A',
        },
      },
    ]);

    render(
      <table>
        <tbody>
          <TableBodyRows endIndex={1} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('group:A:3')).toBeTruthy();
    // The cell path is what it would have taken without the summary, and the
    // group row projects no columns — so a group rendered through it would show
    // the empty cells this asserts are absent.
    expect(screen.queryByText('Name:')).toBeNull();
  });

  it('renders group and detail rows from one result, by row rather than by mode', () => {
    setupDefaultMocks();
    useGetTableDataMock.mockReturnValue([
      {
        [TABLE_GROUP_ROW_FIELD]: { columnKey: 'name', count: 1, label: 'A' },
      },
      { amount: 10, name: 'A' },
    ]);

    const { container } = render(
      <table>
        <tbody>
          <TableBodyRows endIndex={2} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    expect(container.querySelectorAll('tr')).toHaveLength(2);
    expect(screen.getByText('group:A:1')).toBeTruthy();
    expect(screen.getByText('Name:A')).toBeTruthy();
  });

  it('emits exactly one row per data row under grouping, which is what the window math counts', () => {
    // `TableBody` sizes <tbody> as totalLoadedRows x rowHeight and derives both
    // spacers from the same number, so a grouped result that emitted a header
    // *plus* a detail row per entry would desynchronize the body from its
    // contents. One row in, one <tr> out, whatever kind of row it is.
    setupDefaultMocks();
    useGetTableDataMock.mockReturnValue([
      { [TABLE_GROUP_ROW_FIELD]: { columnKey: 'name', count: 2, label: 'A' } },
      { [TABLE_GROUP_ROW_FIELD]: { columnKey: 'name', count: 5, label: 'B' } },
      { [TABLE_GROUP_ROW_FIELD]: { columnKey: 'name', count: 1, label: 'C' } },
    ]);

    const { container } = render(
      <table>
        <tbody>
          <TableBodyRows endIndex={3} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    expect(container.querySelectorAll('tr')).toHaveLength(3);
  });

  it('keys group rows by their own values, so a reorder moves the group node', () => {
    setupDefaultMocks();
    useGetTableDataMock.mockReturnValue([
      { [TABLE_GROUP_ROW_FIELD]: { columnKey: 'name', count: 2, label: 'A' } },
      { [TABLE_GROUP_ROW_FIELD]: { columnKey: 'name', count: 5, label: 'B' } },
    ]);

    const { container, rerender } = render(
      <table>
        <tbody>
          <TableBodyRows endIndex={2} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    const groupNodeForA = container.querySelector('tr');

    expect(groupNodeForA?.textContent).toBe('group:A:2');

    useGetTableDataMock.mockReturnValue([
      { [TABLE_GROUP_ROW_FIELD]: { columnKey: 'name', count: 5, label: 'B' } },
      { [TABLE_GROUP_ROW_FIELD]: { columnKey: 'name', count: 2, label: 'A' } },
    ]);

    rerender(
      <table>
        <tbody>
          <TableBodyRows endIndex={2} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    const reordered = container.querySelectorAll('tr');

    expect(reordered[1]?.textContent).toBe('group:A:2');
    expect(reordered[1]).toBe(groupNodeForA);
  });
});
