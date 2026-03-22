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
  useGetTableIsLoadingMock,
  useGetTableIsLoadingMoreMock,
  useGetTableOverscanMock,
  useGetTableRowHeightMock,
  useRenderTrackerMock,
  useVirtualizationMock,
} = vi.hoisted(() => ({
  useGetColumnGroupsMock: vi.fn(),
  useGetColumnSizingMock: vi.fn(),
  useGetPinnedColumnOffsetsMock: vi.fn(),
  useGetTableDataMock: vi.fn(),
  useGetTableIsLoadingMock: vi.fn(),
  useGetTableIsLoadingMoreMock: vi.fn(),
  useGetTableOverscanMock: vi.fn(),
  useGetTableRowHeightMock: vi.fn(),
  useRenderTrackerMock: vi.fn(),
  useVirtualizationMock: vi.fn(),
}));

type MockSpacerRowProps = {
  readonly colSpan: number;
  readonly height: number;
};

function MockSpacerRow({ colSpan, height }: MockSpacerRowProps) {
  return (
    <tr data-height={height} data-testid='spacer-row'>
      <td colSpan={colSpan} />
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
  useGetTableIsLoading: useGetTableIsLoadingMock,
  useGetTableIsLoadingMore: useGetTableIsLoadingMoreMock,
}));

describe('TableBody', () => {
  it('renders the visible rows from virtualization output', () => {
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);
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
    expect(screen.queryByText(/Spacer:/)).toBeNull();
  });

  it('uses custom column render when provided', () => {
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);
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

  it('renders spacer rows for virtual offset positioning', () => {
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);
    useGetColumnGroupsMock.mockReturnValue({
      centerCols: [{ key: 'name', label: 'Name' }],
      leftPinnedCols: [],
      rightPinnedCols: [],
    });
    useGetColumnSizingMock.mockReturnValue({});
    useGetPinnedColumnOffsetsMock.mockReturnValue({});
    useGetTableDataMock.mockReturnValue([
      { name: 'A' },
      { name: 'B' },
      { name: 'C' },
      { name: 'D' },
    ]);
    useGetTableOverscanMock.mockReturnValue(2);
    useGetTableRowHeightMock.mockReturnValue(40);
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 400,
      containerHeight: 400,
      endIndex: 4,
      offsetY: 80,
      startIndex: 2,
      totalHeight: 800,
      visibleCount: 10,
    });

    const tableContainerRef = {
      current: document.createElement('div'),
    } as RefObject<HTMLDivElement | null>;

    render(
      <table>
        <TableBody tableContainerRef={tableContainerRef} />
      </table>,
    );

    const spacers = screen.getAllByTestId('spacer-row');
    expect(spacers).toHaveLength(2);
    expect(spacers[0]?.dataset.height).toBe('80');
    expect(spacers[1]?.dataset.height).toBe('400');
  });
});
