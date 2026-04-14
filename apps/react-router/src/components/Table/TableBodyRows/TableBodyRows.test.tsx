// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TableBodyRows } from './TableBodyRows.component.tsx';

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
  useGetColumnGroupsMock,
  useGetColumnSizingMock,
  useGetPinnedColumnOffsetsMock,
  useGetTableDataMock,
  useRenderTrackerMock,
} = vi.hoisted(() => ({
  useGetColumnGroupsMock: vi.fn(),
  useGetColumnSizingMock: vi.fn(),
  useGetPinnedColumnOffsetsMock: vi.fn(),
  useGetTableDataMock: vi.fn(),
  useRenderTrackerMock: vi.fn(),
}));

function MockTableBodyCell({
  children,
  isLoadingState: _isLoadingState,
  label,
  value,
}: MockTableBodyCellProps) {
  return (
    <td>
      {children ??
        `${formatMockCellValue(label)}:${formatMockCellValue(value)}`}
    </td>
  );
}

function MockTableRow({ children }: { readonly children: ReactNode }) {
  return <tr>{children}</tr>;
}

vi.mock('@/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetColumnGroups: useGetColumnGroupsMock,
  useGetColumnSizing: useGetColumnSizingMock,
  useGetPinnedColumnOffsets: useGetPinnedColumnOffsetsMock,
}));

vi.mock('@/components/Table/TableBodyCell', () => ({
  TableBodyCell: MockTableBodyCell,
}));

vi.mock('@/components/Table/TableRow', () => ({
  TableRow: MockTableRow,
}));

vi.mock('@/utils/performance', () => ({
  useRenderTracker: useRenderTrackerMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableData: useGetTableDataMock,
}));

const setupDefaultMocks = () => {
  useGetColumnGroupsMock.mockReturnValue({
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
    useGetColumnGroupsMock.mockReturnValue({
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
    useGetColumnGroupsMock.mockReturnValue({
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
