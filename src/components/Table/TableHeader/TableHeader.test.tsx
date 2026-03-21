// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  getPinnedColumnOffsetsMock,
  MockSpacerCell,
  MockTableHeaderCell,
  MockTableRow,
  splitColumnsByPinningMock,
  useColumnVirtualizationMock,
  useGetColumnPinningMock,
  useGetColumnSizingMock,
  useGetEffectiveColumnsMock,
  useGetTableColumnOverscanMock,
  useRenderTrackerMock,
  useTableContainerRefMock,
} = vi.hoisted(() => ({
  getPinnedColumnOffsetsMock: vi.fn(),
  MockSpacerCell: vi.fn(
    ({ width }: { readonly isHeader?: boolean; readonly width: number }) => (
      <th>Spacer:{width}</th>
    ),
  ),
  MockTableHeaderCell: vi.fn(
    ({ columnKey }: { readonly columnKey: string }) => <th>Col:{columnKey}</th>,
  ),
  MockTableRow: vi.fn(({ children }: { readonly children: ReactNode }) => (
    <tr>{children}</tr>
  )),
  splitColumnsByPinningMock: vi.fn(),
  useColumnVirtualizationMock: vi.fn(),
  useGetColumnPinningMock: vi.fn(),
  useGetColumnSizingMock: vi.fn(),
  useGetEffectiveColumnsMock: vi.fn(),
  useGetTableColumnOverscanMock: vi.fn(),
  useRenderTrackerMock: vi.fn(),
  useTableContainerRefMock: vi.fn(),
}));

vi.mock('@/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetColumnPinning: useGetColumnPinningMock,
  useGetColumnSizing: useGetColumnSizingMock,
  useGetEffectiveColumns: useGetEffectiveColumnsMock,
}));

vi.mock('@/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableColumnOverscan: useGetTableColumnOverscanMock,
}));

vi.mock('@/components/Table/contexts/TableWrapper', () => ({
  useTableContainerRef: useTableContainerRefMock,
}));

vi.mock('@/components/Table/utils', () => ({
  getPinnedColumnOffsets: getPinnedColumnOffsetsMock,
  splitColumnsByPinning: splitColumnsByPinningMock,
}));

vi.mock('@/hooks', () => ({
  useColumnVirtualization: useColumnVirtualizationMock,
}));

vi.mock('@/utils/performance', () => ({
  useRenderTracker: useRenderTrackerMock,
}));

vi.mock('../SpacerCell', () => ({
  SpacerCell: MockSpacerCell,
}));

vi.mock('../TableHeaderCell', () => ({
  TableHeaderCell: MockTableHeaderCell,
}));

vi.mock('../TableRow', () => ({
  TableRow: MockTableRow,
}));

import { TableHeader } from './TableHeader.component';

afterEach(cleanup);

describe('TableHeader', () => {
  it('renders a thead element with data-testid', () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ];
    useGetEffectiveColumnsMock.mockReturnValue(columns);
    useGetColumnPinningMock.mockReturnValue({ left: [], right: [] });
    useGetColumnSizingMock.mockReturnValue({});
    useGetTableColumnOverscanMock.mockReturnValue(2);
    useTableContainerRefMock.mockReturnValue({ current: undefined });
    getPinnedColumnOffsetsMock.mockReturnValue({});
    splitColumnsByPinningMock.mockReturnValue({
      centerCols: columns,
      centerColumnWidths: [100, 100],
      leftPinnedCols: [],
      rightPinnedCols: [],
    });
    useColumnVirtualizationMock.mockReturnValue({
      endIndex: 2,
      leftSpacerWidth: 0,
      rightSpacerWidth: 0,
      startIndex: 0,
      totalWidth: 200,
    });

    render(
      <table>
        <TableHeader />
      </table>,
    );

    expect(screen.getByTestId('table-header').tagName).toBe('THEAD');
    expect(screen.getByText('Col:name').textContent).toBe('Col:name');
    expect(screen.getByText('Col:age').textContent).toBe('Col:age');
  });

  it('renders spacer cells when spacer widths are non-zero', () => {
    const columns = [{ key: 'name', label: 'Name' }];
    useGetEffectiveColumnsMock.mockReturnValue(columns);
    useGetColumnPinningMock.mockReturnValue({ left: [], right: [] });
    useGetColumnSizingMock.mockReturnValue({});
    useGetTableColumnOverscanMock.mockReturnValue(2);
    useTableContainerRefMock.mockReturnValue({ current: undefined });
    getPinnedColumnOffsetsMock.mockReturnValue({});
    splitColumnsByPinningMock.mockReturnValue({
      centerCols: columns,
      centerColumnWidths: [100],
      leftPinnedCols: [],
      rightPinnedCols: [],
    });
    useColumnVirtualizationMock.mockReturnValue({
      endIndex: 1,
      leftSpacerWidth: 50,
      rightSpacerWidth: 75,
      startIndex: 0,
      totalWidth: 225,
    });

    render(
      <table>
        <TableHeader />
      </table>,
    );

    expect(screen.getByText('Spacer:50').textContent).toBe('Spacer:50');
    expect(screen.getByText('Spacer:75').textContent).toBe('Spacer:75');
  });

  it('renders pinned columns', () => {
    const leftCol = { key: 'id', label: 'ID' };
    const centerCols = [{ key: 'name', label: 'Name' }];
    useGetEffectiveColumnsMock.mockReturnValue([leftCol, ...centerCols]);
    useGetColumnPinningMock.mockReturnValue({ left: ['id'], right: [] });
    useGetColumnSizingMock.mockReturnValue({});
    useGetTableColumnOverscanMock.mockReturnValue(2);
    useTableContainerRefMock.mockReturnValue({ current: undefined });
    getPinnedColumnOffsetsMock.mockReturnValue({});
    splitColumnsByPinningMock.mockReturnValue({
      centerCols,
      centerColumnWidths: [100],
      leftPinnedCols: [leftCol],
      rightPinnedCols: [],
    });
    useColumnVirtualizationMock.mockReturnValue({
      endIndex: 1,
      leftSpacerWidth: 0,
      rightSpacerWidth: 0,
      startIndex: 0,
      totalWidth: 100,
    });

    render(
      <table>
        <TableHeader />
      </table>,
    );

    expect(screen.getByText('Col:id').textContent).toBe('Col:id');
    expect(screen.getAllByText('Col:name')[0]?.textContent).toBe('Col:name');
  });
});
