// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { tableBodyCellStyles } from '#ui/components/Table/TableBodyCell/TableBodyCell.stylex';
import { TableHeader } from '#ui/components/Table/TableHeader';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { GroupedTableTestShell } from '#ui/utils/tests/groupedTableTestShell.util';
import { renderGroupedTableRoute } from '#ui/utils/tests/renderGroupedTableRoute.util';

type TestRow = Record<string, unknown>;

const GROUPING_KEYS = ['order_date'];

const AGGREGATES: readonly TableColumnAggregate[] = [
  { columnKey: 'total_amount', fn: 'sum' },
];

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { dataType: 'date', key: 'order_date', label: 'Order Date' },
  { dataType: 'currency', key: 'total_amount', label: 'Total Amount' },
  { dataType: 'date', key: 'shipped_at', label: 'Shipped At' },
  {
    dataType: 'currency',
    key: 'invoice',
    label: 'Invoice',
    render: (row) => <span>{String(row.invoice)}</span>,
  },
];

const rows: readonly TestRow[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [{ columnKey: 'total_amount', fn: 'sum', value: '4200' }],
      count: 1,
      isSubtotal: false,
      path: [
        { columnKey: 'order_date', label: '2026-01-04', value: '2026-01-04' },
      ],
    },
  },
  // A detail row of that group, carrying the raw column values. It renders over the same
  // partition as the group row above it (ADR-065).
  {
    id: 7,
    invoice: 99,
    order_date: '2026-01-04',
    shipped_at: '2026-01-06',
    total_amount: 4200,
  },
];

type HarnessProps = {
  readonly aggregates?: readonly TableColumnAggregate[];
  readonly data?: readonly TestRow[];
  readonly groupingKeys?: readonly string[];
};

const Harness = ({
  aggregates = AGGREGATES,
  data = rows,
  groupingKeys = GROUPING_KEYS,
}: HarnessProps) => (
  <NotificationProvider>
    <GroupedTableTestShell
      columns={columns}
      data={data}
      groupingState={{
        aggregates,
        keys: groupingKeys,
      }}
      header={<TableHeader />}
    />
  </NotificationProvider>
);

const renderGrid = (props: HarnessProps = {}) =>
  renderGroupedTableRoute(<Harness {...props} />);

const classesOf = (className: string | undefined) =>
  (className ?? '').split(' ').filter(Boolean);

const RIGHT_CLASSES = classesOf(
  stylex.props(tableBodyCellStyles.alignRight).className,
);
const CENTER_CLASSES = classesOf(
  stylex.props(tableBodyCellStyles.alignCenter).className,
);

const alignmentOf = (cell: Element | undefined) => {
  if (cell === undefined) return 'missing';

  const applied = new Set(classesOf(cell.className));

  if (RIGHT_CLASSES.every((cls) => applied.has(cls))) return 'right';
  if (CENTER_CLASSES.every((cls) => applied.has(cls))) return 'center';

  return 'default';
};

const alignmentsByColumn = (row: Element | undefined) => {
  const labels = screen
    .getAllByTestId('table-header-label')
    .map((el) => el.textContent ?? '');
  const cells = [...(row?.querySelectorAll('[role="gridcell"]') ?? [])];

  return Object.fromEntries(
    labels.map((label, index) => [label, alignmentOf(cells[index])]),
  );
};

const groupRowAlignments = () =>
  alignmentsByColumn(screen.getByTestId('table-group-header-row'));

const detailRowAlignments = () =>
  alignmentsByColumn(screen.getAllByRole('row').at(-1));

describe('cell alignment on a grouped grid', () => {
  afterEach(cleanup);

  it('aligns every group-row cell by its own column’s type', () => {
    renderGrid();

    expect(groupRowAlignments()).toStrictEqual({
      'Order Date': 'center',
      Sum: 'right',
    });
  });

  it('aligns a detail row’s blanked and empty cells the same way', () => {
    renderGrid();

    expect(detailRowAlignments()).toStrictEqual({
      'Order Date': 'center',
      Sum: 'right',
    });
  });

  it('leaves the cell a consumer renders its own alignment, ungrouped', () => {
    renderGrid({
      aggregates: [],
      data: [rows[1] as TestRow],
      groupingKeys: [],
    });

    expect(detailRowAlignments()).toStrictEqual({
      Id: 'right',
      Invoice: 'default',
      'Order Date': 'center',
      'Shipped At': 'center',
      'Total Amount': 'right',
    });
  });
});
