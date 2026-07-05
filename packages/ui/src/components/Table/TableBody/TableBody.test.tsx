// @vitest-environment jsdom
import type { RefObject } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TableBody } from './TableBody.component';

const {
  useGetColumnGroupsMock,
  useGetTableIsLoadingMock,
  useGetTableIsLoadingMoreMock,
  useGetTableOverscanMock,
  useGetTableRowHeightMock,
  useGetTableTotalLoadedRowsMock,
  useVirtualizationMock,
} = vi.hoisted(() => ({
  useGetColumnGroupsMock: vi.fn(),
  useGetTableIsLoadingMock: vi.fn(),
  useGetTableIsLoadingMoreMock: vi.fn(),
  useGetTableOverscanMock: vi.fn(),
  useGetTableRowHeightMock: vi.fn(),
  useGetTableTotalLoadedRowsMock: vi.fn(),
  useVirtualizationMock: vi.fn(),
}));

type MockSpacerRowProps = {
  readonly colSpan: number;
  readonly height: number;
};

type MockTableBodyRowsProps = {
  readonly endIndex: number;
  readonly isLoadingState: boolean;
  readonly startIndex: number;
};

const MockSpacerRow = vi.hoisted(() => {
  return function MockSpacerRow({ colSpan, height }: MockSpacerRowProps) {
    return (
      <tr data-height={height} data-testid='spacer-row'>
        <td colSpan={colSpan} />
      </tr>
    );
  };
});

const MockTableBodyRows = vi.hoisted(() => {
  return function MockTableBodyRows({
    endIndex,
    isLoadingState,
    startIndex,
  }: MockTableBodyRowsProps) {
    return (
      <tr
        data-end-index={endIndex}
        data-is-loading={isLoadingState}
        data-start-index={startIndex}
        data-testid='table-body-rows'
      >
        <td>rows</td>
      </tr>
    );
  };
});

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetColumnGroups: useGetColumnGroupsMock,
  }),
);

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableOverscan: useGetTableOverscanMock,
    useGetTableRowHeight: useGetTableRowHeightMock,
  }),
);

vi.mock('@repo/ui/components/Table/SpacerRow', () => ({
  SpacerRow: MockSpacerRow,
}));

vi.mock('@repo/ui/components/Table/TableBodyRows', () => ({
  TableBodyRows: MockTableBodyRows,
}));

vi.mock('@repo/ui/components/Table/TableEmptyState', () => ({
  TableEmptyState: ({
    message,
    title,
  }: {
    readonly message?: string;
    readonly title?: string;
  }) => (
    <tr
      data-message={message}
      data-testid='table-empty-state'
      data-title={title}
    >
      <td>empty</td>
    </tr>
  ),
}));

vi.mock('@repo/ui/hooks', () => ({
  useVirtualization: useVirtualizationMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableIsLoading: useGetTableIsLoadingMock,
  useGetTableIsLoadingMore: useGetTableIsLoadingMoreMock,
  useGetTableTotalLoadedRows: useGetTableTotalLoadedRowsMock,
}));

const setupDefaultMocks = () => {
  useGetTableIsLoadingMock.mockReturnValue(false);
  useGetTableIsLoadingMoreMock.mockReturnValue(false);
  useGetTableTotalLoadedRowsMock.mockReturnValue(3);
  useGetColumnGroupsMock.mockReturnValue({
    centerCols: [
      { key: 'name', label: 'Name' },
      { key: 'amount', label: 'Amount' },
    ],
    leftPinnedCols: [],
    rightPinnedCols: [],
  });
  useGetTableOverscanMock.mockReturnValue(3);
  useGetTableRowHeightMock.mockReturnValue(44);
};

describe('TableBody', () => {
  afterEach(cleanup);

  it('delegates row rendering to TableBodyRows with correct props', () => {
    setupDefaultMocks();
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 50,
      endIndex: 2,
      offsetY: 0,
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

    const bodyRows = screen.getByTestId('table-body-rows');
    expect(bodyRows.dataset.startIndex).toBe('0');
    expect(bodyRows.dataset.endIndex).toBe('2');
    expect(bodyRows.dataset.isLoading).toBe('false');
  });

  it('passes isLoadingState as true when loading or loading more', () => {
    setupDefaultMocks();
    useGetTableIsLoadingMoreMock.mockReturnValue(true);
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 0,
      endIndex: 3,
      offsetY: 0,
      startIndex: 0,
      totalHeight: 132,
    });

    const tableContainerRef = {
      current: document.createElement('div'),
    } as RefObject<HTMLDivElement | null>;

    render(
      <table>
        <TableBody tableContainerRef={tableContainerRef} />
      </table>,
    );

    const bodyRows = screen.getByTestId('table-body-rows');
    expect(bodyRows.dataset.isLoading).toBe('true');
  });

  it('renders spacer rows for virtual offset positioning', () => {
    setupDefaultMocks();
    useGetTableTotalLoadedRowsMock.mockReturnValue(4);
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 400,
      endIndex: 4,
      offsetY: 80,
      startIndex: 2,
      totalHeight: 800,
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

  it('passes totalLoadedRows to useVirtualization as totalItems', () => {
    setupDefaultMocks();
    useGetTableTotalLoadedRowsMock.mockReturnValue(42);
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 0,
      endIndex: 10,
      offsetY: 0,
      startIndex: 0,
      totalHeight: 1848,
    });

    const tableContainerRef = {
      current: document.createElement('div'),
    } as RefObject<HTMLDivElement | null>;

    render(
      <table>
        <TableBody tableContainerRef={tableContainerRef} />
      </table>,
    );

    expect(useVirtualizationMock).toHaveBeenCalledWith(
      expect.objectContaining({ totalItems: 42 }),
    );
  });

  it('renders the empty state when there are no rows and not loading', () => {
    setupDefaultMocks();
    useGetTableTotalLoadedRowsMock.mockReturnValue(0);
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 0,
      endIndex: 0,
      offsetY: 0,
      startIndex: 0,
      totalHeight: 0,
    });

    const tableContainerRef = {
      current: document.createElement('div'),
    } as RefObject<HTMLDivElement | null>;

    render(
      <table>
        <TableBody
          emptyState={{ title: 'Nothing here' }}
          tableContainerRef={tableContainerRef}
        />
      </table>,
    );

    const emptyState = screen.getByTestId('table-empty-state');
    expect(emptyState.dataset.title).toBe('Nothing here');
    expect(screen.queryByTestId('table-body-rows')).toBeNull();
  });

  it('does not render the empty state while loading with no rows', () => {
    setupDefaultMocks();
    useGetTableTotalLoadedRowsMock.mockReturnValue(0);
    useGetTableIsLoadingMock.mockReturnValue(true);
    useVirtualizationMock.mockReturnValue({
      bottomSpacerHeight: 0,
      endIndex: 0,
      offsetY: 0,
      startIndex: 0,
      totalHeight: 0,
    });

    const tableContainerRef = {
      current: document.createElement('div'),
    } as RefObject<HTMLDivElement | null>;

    render(
      <table>
        <TableBody tableContainerRef={tableContainerRef} />
      </table>,
    );

    expect(screen.queryByTestId('table-empty-state')).toBeNull();
    expect(screen.getByTestId('table-body-rows')).not.toBeNull();
  });
});
