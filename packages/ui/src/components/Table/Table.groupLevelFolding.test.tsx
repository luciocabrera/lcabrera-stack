// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type {
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { GroupedTableTestShell } from '#ui/utils/tests/groupedTableTestShell.util';

type TestRow = Record<string, unknown>;

const GROUPING_KEYS = ['status', 'customerType', 'priority'];

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'status', label: 'Status' },
  { key: 'customerType', label: 'Customer Type' },
  { key: 'priority', label: 'Priority' },
];

const STATUS_CELL = 0;
const CUSTOMER_CELL = 1;

const pathOf = (...labels: readonly string[]): readonly TableGroupKeyValue[] =>
  labels.map((label, index) => ({
    columnKey: GROUPING_KEYS[index] ?? 'priority',
    label,
    value: label,
  }));

type GroupRowArgs = {
  readonly isSubtotal?: boolean;
  readonly path: readonly TableGroupKeyValue[];
};

const groupRow = ({ isSubtotal = false, path }: GroupRowArgs): TestRow => ({
  [TABLE_GROUP_ROW_FIELD]: { aggregates: [], count: 2, isSubtotal, path },
});

const rows: readonly TestRow[] = [
  groupRow({ path: pathOf('Cancelled', 'Business', 'Critical') }),
  groupRow({ path: pathOf('Cancelled', 'Business', 'High') }),
  groupRow({ isSubtotal: true, path: pathOf('Cancelled', 'Business') }),
  groupRow({ path: pathOf('Cancelled', 'Retail', 'Critical') }),
  groupRow({ isSubtotal: true, path: pathOf('Cancelled', 'Retail') }),
  groupRow({ isSubtotal: true, path: pathOf('Cancelled') }),
  groupRow({ path: pathOf('Active', 'Business', 'Critical') }),
  groupRow({ isSubtotal: true, path: pathOf('Active', 'Business') }),
  groupRow({ isSubtotal: true, path: pathOf('Active') }),
];

const Harness = () => (
  <GroupedTableTestShell
    columns={columns}
    data={rows}
    groupingState={{ keys: GROUPING_KEYS }}
  />
);

const getRows = () => screen.getAllByTestId('table-group-header-row');

type CellArgs = {
  readonly index: number;
  readonly row: Element;
};

const cellOf = ({ index, row }: CellArgs) =>
  [...row.querySelectorAll('[role="gridcell"]')][index];

const chevronIn = (args: CellArgs) =>
  cellOf(args)?.querySelector('[data-testid="table-group-disclosure"]');

const drawnLabels = () =>
  getRows().map((row) =>
    [...row.querySelectorAll('[data-testid="table-group-key-cell"]')]
      .map((cell) => cell.textContent?.trim() ?? '')
      .join(' | '),
  );

describe('folding a group from the row that starts it', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      queueMicrotask(() => {
        callback(0);
      });

      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('offers an outer level’s control on the first row of its block', () => {
    render(<Harness />);

    expect(
      chevronIn({ index: STATUS_CELL, row: getRows()[0] as Element }),
    ).not.toBeNull();
  });

  it('folds the level the clicked column holds, not the row’s own group', () => {
    render(<Harness />);

    expect(getRows()).toHaveLength(9);

    fireEvent.click(
      chevronIn({
        index: STATUS_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );

    expect(drawnLabels()).toStrictEqual([
      'Cancelled total',
      'Active | Business | Critical',
      'Business total',
      'Active total',
    ]);
  });

  it('removes the nested subtotals with the block, keeping the level’s own', () => {
    render(<Harness />);

    fireEvent.click(
      chevronIn({
        index: STATUS_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );

    const labels = drawnLabels();

    expect(labels).not.toContain('Retail total');
    expect(labels.filter((label) => label.includes('Business total'))).toEqual([
      'Business total',
    ]);
    expect(labels).toContain('Cancelled total');
  });

  it('reopens the group from the subtotal it collapsed to', () => {
    render(<Harness />);

    fireEvent.click(
      chevronIn({
        index: STATUS_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );
    expect(getRows()).toHaveLength(4);

    fireEvent.click(
      chevronIn({
        index: STATUS_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );

    expect(getRows()).toHaveLength(9);
  });

  it('leaves an open subtotal no control in the level it totals', () => {
    render(<Harness />);

    expect(
      chevronIn({ index: CUSTOMER_CELL, row: getRows()[2] as Element }),
    ).toBeNull();
    expect(
      chevronIn({ index: CUSTOMER_CELL, row: getRows()[0] as Element }),
    ).not.toBeNull();
  });

  it('reserves the chevron’s space on a drawn cell that has no control', () => {
    render(<Harness />);

    const subtotalCell = cellOf({
      index: CUSTOMER_CELL,
      row: getRows()[2] as Element,
    });

    expect(subtotalCell?.querySelector('span')).not.toBeNull();
  });
});
