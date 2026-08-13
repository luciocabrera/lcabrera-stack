// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  TABLE_GROUP_HIERARCHY_COLUMN_KEY,
  TABLE_GROUP_ROW_FIELD,
} from '#ui/components/Table/Table.constants';

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
  useGetTableCollapsedGroupPathsMock,
  useGetTableDataMock,
  useGetTableGroupingKeysMock,
} = vi.hoisted(() => ({
  useGetColumnSizingMock: vi.fn(),
  useGetColumnsMock: vi.fn(),
  useGetPinnedColumnOffsetsMock: vi.fn(),
  useGetPinnedColumnPartitionMock: vi.fn(),
  useGetTableCollapsedGroupPathsMock: vi.fn(),
  useGetTableDataMock: vi.fn(),
  useGetTableGroupingKeysMock: vi.fn((): readonly string[] => []),
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
  return function MockTableRow({
    children,
    ...rest
  }: {
    readonly children: ReactNode;
  }) {
    return <tr {...rest}>{children}</tr>;
  };
});

const MockTableGroupLabel = vi.hoisted(() => {
  return function MockTableGroupLabel({
    summary,
  }: {
    readonly summary: {
      readonly count: number;
      readonly path: readonly { readonly label: string }[];
    };
  }) {
    const labels = summary.path.map((level) => level.label).join('/');

    return `group:${labels}:${summary.count}`;
  };
});

const MockTableGroupAggregate = vi.hoisted(() => {
  return function MockTableGroupAggregate({
    columnKey,
  }: {
    readonly columnKey: string;
  }) {
    return `agg:${columnKey}`;
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

vi.mock('#ui/components/Table/TableGroupLabel', () => ({
  TableGroupLabel: MockTableGroupLabel,
}));

vi.mock('#ui/components/Table/TableGroupAggregate', () => ({
  TableGroupAggregate: MockTableGroupAggregate,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableGroupingKeys: useGetTableGroupingKeysMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableData: useGetTableDataMock,
}));

// Only the store read is stubbed here. `useTableGroupTree` and the tree
// derivation under it run for real, so what this suite renders is what a
// collapse actually produces rather than a hand-written row list (ADR-067).
vi.mock(
  '#ui/components/Table/contexts/TableConfig/expansion/selectors',
  () => ({
    useGetTableCollapsedGroupPaths: useGetTableCollapsedGroupPathsMock,
  }),
);

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
  useGetTableCollapsedGroupPathsMock.mockReturnValue(new Set<string>());
  useGetTableGroupingKeysMock.mockReturnValue([]);
  useGetTableDataMock.mockReturnValue([
    { amount: 10, name: 'A' },
    { amount: 20, name: 'B' },
    { amount: 30, name: 'C' },
  ]);
};

/**
 * The partition a grouped table actually paints: the grid's own hierarchy
 * column at the head of the left-pinned group, then the data columns
 * (ADR-065).
 */
const setupGroupedMocks = () => {
  setupDefaultMocks();
  useGetTableGroupingKeysMock.mockReturnValue(['name']);
  useGetPinnedColumnPartitionMock.mockReturnValue({
    centerCols: [
      { key: 'name', label: 'Name' },
      { key: 'amount', label: 'Amount' },
    ],
    leftPinnedCols: [{ key: TABLE_GROUP_HIERARCHY_COLUMN_KEY, label: 'Name' }],
    rightPinnedCols: [],
  });
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

  it('renders a group row as a full row of cells, the label in the hierarchy column', () => {
    setupGroupedMocks();
    useGetTableDataMock.mockReturnValue([
      {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 3,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'A' }],
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

    // One cell per rendered column, not one spanning cell: the label sits in
    // the hierarchy column and every other column carries that group's
    // aggregate (ADR-065). The banner this replaces had exactly one cell.
    const cells = [...(screen.getByRole('row').querySelectorAll('td') ?? [])];

    expect(cells.map((cell) => cell.textContent)).toStrictEqual([
      'group:A:3',
      'agg:name',
      'agg:amount',
    ]);
  });

  it('marks a group row so a grouped body is recognisable in the DOM', () => {
    setupGroupedMocks();
    useGetTableDataMock.mockReturnValue([
      {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 3,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'A' }],
        },
      },
      { amount: 10, name: 'A' },
    ]);

    render(
      <table>
        <tbody>
          <TableBodyRows endIndex={2} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    expect(screen.getAllByTestId('table-group-header-row')).toHaveLength(1);
  });

  it('blanks a grouped-by column on a detail row, leaving the ungrouped ones', () => {
    // The value is stated once, by the group row above; repeating it down a
    // column whose header already says it is a column of one word (ADR-065).
    setupGroupedMocks();
    useGetTableDataMock.mockReturnValue([{ amount: 10, name: 'A' }]);

    render(
      <table>
        <tbody>
          <TableBodyRows endIndex={1} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    expect(screen.queryByText('Name:A')).toBeNull();
    expect(screen.getByText('Amount:10')).toBeTruthy();
  });

  it('renders group and detail rows from one result, by row rather than by mode', () => {
    setupGroupedMocks();
    useGetTableGroupingKeysMock.mockReturnValue([]);
    useGetTableDataMock.mockReturnValue([
      {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 1,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'A' }],
        },
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
    // `TableBody` sizes <tbody> from a row count times rowHeight and derives
    // both spacers from that same number, so a grouped result that emitted a
    // header *plus* a detail row per entry would desynchronize the body from
    // its contents. One row in, one <tr> out, whatever kind of row it is.
    setupGroupedMocks();
    useGetTableDataMock.mockReturnValue([
      {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 2,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'A' }],
        },
      },
      {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 5,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'B' }],
        },
      },
      {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 1,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'C' }],
        },
      },
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
    setupGroupedMocks();
    useGetTableDataMock.mockReturnValue([
      {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 2,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'A' }],
        },
      },
      {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 5,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'B' }],
        },
      },
    ]);

    const { container, rerender } = render(
      <table>
        <tbody>
          <TableBodyRows endIndex={2} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    const groupNodeForA = container.querySelector('tr');

    expect(groupNodeForA?.textContent).toContain('group:A:2');

    useGetTableDataMock.mockReturnValue([
      {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 5,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'B' }],
        },
      },
      {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 2,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'A' }],
        },
      },
    ]);

    rerender(
      <table>
        <tbody>
          <TableBodyRows endIndex={2} isLoadingState={false} startIndex={0} />
        </tbody>
      </table>,
    );

    const reordered = container.querySelectorAll('tr');

    expect(reordered[1]?.textContent).toContain('group:A:2');
    expect(reordered[1]).toBe(groupNodeForA);
  });
});
