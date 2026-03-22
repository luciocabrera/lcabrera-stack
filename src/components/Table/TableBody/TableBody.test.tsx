// @vitest-environment jsdom

import type { ReactNode, RefObject } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TableBody } from './TableBody.component';

type MockTableBodyCellProps = {
  readonly children?: ReactNode;
  readonly label?: string;
  readonly value?: unknown;
};

const {
  useGetColumnGroupsMock,
  useGetColumnSizingMock,
  useGetPinnedColumnOffsetsMock,
  useGetTableDataMock,
  useGetTableOverscanMock,
  useGetTableRowHeightMock,
  useRenderTrackerMock,
  useVirtualizationMock,
} = vi.hoisted(() => ({
  useGetColumnGroupsMock: vi.fn(),
  useGetColumnSizingMock: vi.fn(),
  useGetPinnedColumnOffsetsMock: vi.fn(),
  useGetTableDataMock: vi.fn(),
  useGetTableOverscanMock: vi.fn(),
  useGetTableRowHeightMock: vi.fn(),
  useRenderTrackerMock: vi.fn(),
  useVirtualizationMock: vi.fn(),
}));

function MockSpacerRow({ height }: { readonly height: number }) {
  return (
    <tr>
      <td>Spacer:{height}</td>
    </tr>
  );
}

function MockTableBodyCell({ children, label, value }: MockTableBodyCellProps) {
  return <td>{children ?? `${String(label)}:${String(value)}`}</td>;
}

function MockTableRow({ children }: { readonly children: ReactNode }) {
  return <tr>{children}</tr>;
}

vi.mock('@/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetColumnGroups: useGetColumnGroupsMock,
  useGetColumnSizing: useGetColumnSizingMock,
  useGetPinnedColumnOffsets: useGetPinnedColumnOffsetsMock,
}));

vi.mock('@/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableOverscan: useGetTableOverscanMock,
  useGetTableRowHeight: useGetTableRowHeightMock,
}));

vi.mock('@/components/Table/SpacerRow', () => ({
  SpacerRow: MockSpacerRow,
}));

vi.mock('@/components/Table/TableBodyCell', () => ({
  TableBodyCell: MockTableBodyCell,
}));

vi.mock('@/components/Table/TableRow', () => ({
  TableRow: MockTableRow,
}));

vi.mock('@/hooks', () => ({
  useVirtualization: useVirtualizationMock,
}));

vi.mock('@/utils/performance', () => ({
  useRenderTracker: useRenderTrackerMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableData: useGetTableDataMock,
}));

describe('TableBody', () => {
  it('renders visible rows and spacer rows from virtualization output', () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'amount', label: 'Amount' },
    ];
    useGetColumnGroupsMock.mockReturnValue({
      centerCols: columns,
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
    useGetTableOverscanMock.mockReturnValue(3);
    useGetTableRowHeightMock.mockReturnValue(44);
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 50,
      endIndex: 2,
      offsetY: 30,
      startIndex: 0,
      totalHeight: 500,
    });

    const tableContainerRef = {
      current: document.createElement('div'),
    } as RefObject<HTMLDivElement | null>;

    render(
      <table>
        <TableBody tableContainerRef={tableContainerRef} />
      </table>,
    );

    expect(screen.getByTestId('table-body').tagName).toBe('TBODY');
    expect(screen.getByText('Name:A').textContent).toBe('Name:A');
    expect(screen.getByText('Amount:10').textContent).toBe('Amount:10');
    expect(screen.getByText('Name:B').textContent).toBe('Name:B');
    expect(screen.getByText('Spacer:30').textContent).toBe('Spacer:30');
    expect(screen.getByText('Spacer:50').textContent).toBe('Spacer:50');
  });

  it('uses custom column render when provided', () => {
    const columns = [
      {
        key: 'name',
        label: 'Name',
        render: (row: Record<string, unknown>) => `custom:${String(row.name)}`,
      },
    ];
    useGetColumnGroupsMock.mockReturnValue({
      centerCols: columns,
      leftPinnedCols: [],
      rightPinnedCols: [],
    });
    useGetColumnSizingMock.mockReturnValue({});
    useGetPinnedColumnOffsetsMock.mockReturnValue({});
    useGetTableDataMock.mockReturnValue([{ name: 'Z' }]);
    useGetTableOverscanMock.mockReturnValue(2);
    useGetTableRowHeightMock.mockReturnValue(40);
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 0,
      endIndex: 1,
      offsetY: 0,
      startIndex: 0,
      totalHeight: 40,
    });

    const tableContainerRef = {
      current: document.createElement('div'),
    } as RefObject<HTMLDivElement | null>;

    render(
      <table>
        <TableBody tableContainerRef={tableContainerRef} />
      </table>,
    );

    expect(screen.getByText('custom:Z').textContent).toBe('custom:Z');
  });
});
