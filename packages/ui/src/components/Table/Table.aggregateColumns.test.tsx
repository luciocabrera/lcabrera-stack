// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import {
  TableConfigProvider,
  TableDataProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
import { useSetColumnSorting } from '#ui/components/Table/contexts/TableConfig/columns/actions/useSetColumnSorting.hook';
import { TableWrapperContext } from '#ui/components/Table/contexts/TableWrapper/TableWrapperContext.context';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { TableBase } from '#ui/components/Table/TableBase';
import { TableBody } from '#ui/components/Table/TableBody';
import { TableHeader } from '#ui/components/Table/TableHeader';
import { NotificationProvider } from '#ui/contexts/NotificationContext';

type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const CONTAINER_HEIGHT = 400;
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

const attachScrollMetrics = (container: HTMLDivElement | null) => {
  if (!container) return;
  if (Object.getOwnPropertyDescriptor(container, 'scrollTop')) return;

  Object.defineProperties(container, {
    clientHeight: { configurable: true, value: CONTAINER_HEIGHT },
    offsetHeight: { configurable: true, value: CONTAINER_HEIGHT },
    scrollTop: { configurable: true, value: 0, writable: true },
  });
};

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

const Harness = ({ aggregates = AGGREGATES }: HarnessProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const setContainer = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    attachScrollMetrics(node);
  };

  return (
    <NotificationProvider>
      <TableConfigProvider<TestRow>
        columnsState={{ columns }}
        metaState={{
          groupingAggregates: aggregates,
          groupingKeys: GROUPING_KEYS,
          overscan: 2,
          rowHeight: ROW_HEIGHT,
        }}
      >
        <TableFocusProvider>
          <TableDataProvider<TestRow>
            dataState={{
              data: rows,
              isLoading: false,
              isLoadingMore: false,
              totalRows: rows.length,
            }}
          >
            <TableWrapperContext value={{ containerRef, wrapperRef }}>
              <div data-testid='scroll-container' ref={setContainer}>
                <SortProbe />
                <TableBase>
                  <TableHeader />
                  <TableBody tableContainerRef={containerRef} />
                </TableBase>
              </div>
            </TableWrapperContext>
          </TableDataProvider>
        </TableFocusProvider>
      </TableConfigProvider>
    </NotificationProvider>
  );
};

const renderGrid = (props: HarnessProps = {}) =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        { element: <Harness {...props} />, path: '/' },
        { action: () => ({ ok: true }), path: '/_action/persist-cookie' },
      ])}
    />,
  );

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
