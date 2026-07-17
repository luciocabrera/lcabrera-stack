// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  useGetPinnedColumnOffsetsMock,
  useGetPinnedColumnPartitionMock,
  useGetTableDataMock,
} = vi.hoisted(() => ({
  useGetColumnSizingMock: vi.fn(),
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

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetColumnSizing: useGetColumnSizingMock,
    useGetPinnedColumnOffsets: useGetPinnedColumnOffsetsMock,
    useGetPinnedColumnPartition: useGetPinnedColumnPartitionMock,
  }),
);

vi.mock('@repo/ui/components/Table/TableBodyCell', () => ({
  TableBodyCell: MockTableBodyCell,
}));

vi.mock('@repo/ui/components/Table/TableRow', () => ({
  TableRow: MockTableRow,
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
});
