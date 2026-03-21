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
  getPinnedColumnOffsetsMock,
  splitColumnsByPinningMock,
  useColumnVirtualizationMock,
  useGetColumnPinningMock,
  useGetColumnSizingMock,
  useGetEffectiveColumnsMock,
  useGetTableColumnOverscanMock,
  useGetTableDataMock,
  useGetTableOverscanMock,
  useGetTableRowHeightMock,
  useRenderTrackerMock,
  useTableContainerRefMock,
  useVirtualizationMock,
} = vi.hoisted(() => ({
  getPinnedColumnOffsetsMock: vi.fn(),
  splitColumnsByPinningMock: vi.fn(),
  useColumnVirtualizationMock: vi.fn(),
  useGetColumnPinningMock: vi.fn(),
  useGetColumnSizingMock: vi.fn(),
  useGetEffectiveColumnsMock: vi.fn(),
  useGetTableColumnOverscanMock: vi.fn(),
  useGetTableDataMock: vi.fn(),
  useGetTableOverscanMock: vi.fn(),
  useGetTableRowHeightMock: vi.fn(),
  useRenderTrackerMock: vi.fn(),
  useTableContainerRefMock: vi.fn(),
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
  useGetColumnPinning: useGetColumnPinningMock,
  useGetColumnSizing: useGetColumnSizingMock,
  useGetEffectiveColumns: useGetEffectiveColumnsMock,
}));

vi.mock('@/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableColumnOverscan: useGetTableColumnOverscanMock,
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

vi.mock('@/components/Table/utils', () => ({
  getPinnedColumnOffsets: getPinnedColumnOffsetsMock,
  splitColumnsByPinning: splitColumnsByPinningMock,
}));

vi.mock('@/hooks', () => ({
  useColumnVirtualization: useColumnVirtualizationMock,
  useVirtualization: useVirtualizationMock,
}));

vi.mock('@/utils/performance', () => ({
  useRenderTracker: useRenderTrackerMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableData: useGetTableDataMock,
}));

vi.mock('../contexts/TableWrapper', () => ({
  useTableContainerRef: useTableContainerRefMock,
}));

describe('TableBody', () => {
  it('renders visible rows and spacer rows from virtualization output', () => {
    useGetColumnPinningMock.mockReturnValue({ left: [], right: [] });
    useGetColumnSizingMock.mockReturnValue({});
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'amount', label: 'Amount' },
    ];
    useGetEffectiveColumnsMock.mockReturnValue(columns);
    useGetTableDataMock.mockReturnValue([
      { amount: 10, name: 'A' },
      { amount: 20, name: 'B' },
      { amount: 30, name: 'C' },
    ]);
    useGetTableColumnOverscanMock.mockReturnValue(2);
    useGetTableOverscanMock.mockReturnValue(3);
    useGetTableRowHeightMock.mockReturnValue(44);
    getPinnedColumnOffsetsMock.mockReturnValue({});
    splitColumnsByPinningMock.mockReturnValue({
      centerCols: columns,
      centerColumnWidths: [60, 60],
      leftPinnedCols: [],
      rightPinnedCols: [],
    });
    useTableContainerRefMock.mockReturnValue({
      current: document.createElement('div'),
    });
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 50,
      endIndex: 2,
      offsetY: 30,
      startIndex: 0,
      totalHeight: 500,
    });
    useColumnVirtualizationMock.mockReturnValue({
      endIndex: 2,
      leftSpacerWidth: 0,
      rightSpacerWidth: 0,
      startIndex: 0,
      totalWidth: 120,
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
    useGetColumnPinningMock.mockReturnValue({ left: [], right: [] });
    useGetColumnSizingMock.mockReturnValue({});
    const columns = [
      {
        key: 'name',
        label: 'Name',
        render: (row: Record<string, unknown>) => `custom:${String(row.name)}`,
      },
    ];
    useGetEffectiveColumnsMock.mockReturnValue(columns);
    useGetTableDataMock.mockReturnValue([{ name: 'Z' }]);
    useGetTableColumnOverscanMock.mockReturnValue(2);
    useGetTableOverscanMock.mockReturnValue(2);
    useGetTableRowHeightMock.mockReturnValue(40);
    getPinnedColumnOffsetsMock.mockReturnValue({});
    splitColumnsByPinningMock.mockReturnValue({
      centerCols: columns,
      centerColumnWidths: [60],
      leftPinnedCols: [],
      rightPinnedCols: [],
    });
    useTableContainerRefMock.mockReturnValue({
      current: document.createElement('div'),
    });
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 0,
      endIndex: 1,
      offsetY: 0,
      startIndex: 0,
      totalHeight: 40,
    });
    useColumnVirtualizationMock.mockReturnValue({
      endIndex: 1,
      leftSpacerWidth: 0,
      rightSpacerWidth: 0,
      startIndex: 0,
      totalWidth: 60,
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
