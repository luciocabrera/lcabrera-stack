// @vitest-environment jsdom

import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import { useSetColumnSorting } from '#ui/components/Table/contexts/TableConfig/columns/actions/useSetColumnSorting.hook';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { TableHeader } from '#ui/components/Table/TableHeader';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { GroupedTableTestShell } from '#ui/utils/tests/groupedTableTestShell.util';
import { renderGroupedTableRoute } from '#ui/utils/tests/renderGroupedTableRoute.util';

type TestRow = Record<string, unknown>;

const GROUPING_KEYS = ['customer_type'];

const AGGREGATES: readonly TableColumnAggregate[] = [
  { columnKey: 'total_amount', fn: 'avg' },
  { columnKey: 'total_amount', fn: 'min' },
];

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'customer_type', label: 'Customer Type' },
  { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
];

const rows: readonly TestRow[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [
        { columnKey: 'total_amount', fn: 'avg', value: '2503' },
        { columnKey: 'total_amount', fn: 'min', value: '17' },
      ],
      count: 4,
      isSubtotal: false,
      path: [
        {
          columnKey: 'customer_type',
          label: 'Business',
          value: 'Business',
        },
      ],
    },
  },
  // A detail row: a real order, carrying the raw column values. It
  // renders over the same partition as the group row above it (ADR-065).
  { customer_type: 'Business', id: 7, total_amount: 4200 },
];

const SortProbe = () => {
  const setColumnSorting = useSetColumnSorting<TestRow>();

  return (
    <button
      onClick={() =>
        setColumnSorting({
          columnKey: 'total_amount:avg' as never,
          direction: 'asc',
        })
      }
      type='button'
    >
      sort by average
    </button>
  );
};

type HarnessProps = {
  readonly aggregates?: readonly TableColumnAggregate[];
};

const Harness = ({ aggregates = AGGREGATES }: HarnessProps) => (
  <NotificationProvider>
    <GroupedTableTestShell
      columns={columns}
      data={rows}
      groupingState={{
        aggregates,
        keys: GROUPING_KEYS,
      }}
      header={<TableHeader />}
      toolbar={<SortProbe />}
    />
  </NotificationProvider>
);

const renderGrid = (props: HarnessProps = {}) =>
  renderGroupedTableRoute(<Harness {...props} />);

const headerLabels = () =>
  screen.getAllByTestId('table-header-label').map((el) => el.textContent);

const headerAriaLabels = () =>
  screen
    .getAllByRole('columnheader')
    .map((cell) => cell.getAttribute('aria-label') ?? undefined);

describe('a column carrying several measures', () => {
  afterEach(cleanup);

  it('draws one header per measure, and none for an unnamed column', () => {
    renderGrid();

    expect(headerLabels()).toStrictEqual([
      'Customer Type',
      'Average',
      'Minimum',
    ]);
  });

  it('names the source column in each measure header’s accessible name', () => {
    renderGrid();

    expect(headerAriaLabels()).toStrictEqual([
      undefined,
      'Total Amount Average',
      'Total Amount Minimum',
    ]);
  });

  it('offers each measure its own sort', () => {
    renderGrid();

    expect(
      ['Total Amount Average', 'Total Amount Minimum'].map((name) =>
        screen.getByRole('columnheader', { name }).getAttribute('aria-sort'),
      ),
    ).toStrictEqual(['none', 'none']);
  });

  it('spans the measures with one band naming their source column', () => {
    renderGrid();

    const labelled = screen
      .getAllByTestId('table-header-band')
      .filter((band) => band.textContent !== '');

    expect(labelled.map((band) => band.textContent)).toStrictEqual([
      'Total Amount',
    ]);
  });

  it('hides the band row from assistive technology', () => {
    renderGrid();

    const band = screen.getAllByTestId('table-header-band')[0];

    expect(band?.closest('tr')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('puts one measure in each cell', () => {
    renderGrid();

    const groupRow = screen.getByTestId('table-group-header-row');
    const cells = [...groupRow.querySelectorAll('[role="gridcell"]')].map(
      (cell) => cell.textContent,
    );

    expect(cells).toStrictEqual(['Business', '2,503', '17']);
  });

  it('survives a sort on a measure column', () => {
    renderGrid();

    fireEvent.click(screen.getByRole('button', { name: 'sort by average' }));

    expect(headerLabels()).toStrictEqual([
      'Customer Type',
      'Average',
      'Minimum',
    ]);
    expect(
      screen
        .getByRole('columnheader', { name: 'Total Amount Average' })
        .getAttribute('aria-sort'),
    ).toBe('ascending');
  });

  it('leaves a detail row no cell of its own, a limitation ADR-096 records', () => {
    renderGrid();

    const detail = screen.getAllByRole('row').at(-1);
    const cells = [
      ...(detail?.querySelectorAll('[role="gridcell"]') ?? []),
    ].map((cell) => cell.textContent);

    expect(cells).toStrictEqual(['', '', '']);
  });

  it('bands a single measure too, since its header states only the function', () => {
    renderGrid({ aggregates: [{ columnKey: 'total_amount', fn: 'avg' }] });

    const labelled = screen
      .getAllByTestId('table-header-band')
      .filter((band) => band.textContent !== '');

    expect(labelled.map((band) => band.textContent)).toStrictEqual([
      'Total Amount',
    ]);
    expect(headerLabels()).toStrictEqual(['Customer Type', 'Average']);
  });

  it('draws no band row, and only the key, when no aggregate is applied', () => {
    renderGrid({ aggregates: [] });

    expect(screen.queryAllByTestId('table-header-band')).toHaveLength(0);
    expect(headerLabels()).toStrictEqual(['Customer Type']);
    expect(headerAriaLabels()).toStrictEqual([undefined]);
  });
});

describe('measures from several columns', () => {
  afterEach(cleanup);

  it('paints them in the staged order, not the declared column order', () => {
    renderGrid({
      aggregates: [
        { columnKey: 'total_amount', fn: 'avg' },
        { columnKey: 'total_amount', fn: 'min' },
        { columnKey: 'id', fn: 'count' },
      ],
    });

    expect(headerLabels()).toStrictEqual([
      'Customer Type',
      'Average',
      'Minimum',
      'Count',
    ]);
  });

  it('keeps a column’s measures under one band when the staged list interleaves them', () => {
    renderGrid({
      aggregates: [
        { columnKey: 'total_amount', fn: 'avg' },
        { columnKey: 'id', fn: 'count' },
        { columnKey: 'total_amount', fn: 'min' },
      ],
    });

    expect(headerLabels()).toStrictEqual([
      'Customer Type',
      'Average',
      'Minimum',
      'Count',
    ]);
    expect(
      screen
        .getAllByTestId('table-header-band')
        .map((band) => band.textContent)
        .filter((label) => label !== ''),
    ).toStrictEqual(['Total Amount', 'Id']);
  });
});
