// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import {
  TableConfigProvider,
  TableDataProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
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

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'order_id', label: 'Order' },
  { key: 'customer_type', label: 'Customer Type' },
  { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
];

const groupRow: TestRow = {
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [{ columnKey: 'total_amount', fn: 'avg', value: '2503' }],
    count: 4,
    isSubtotal: false,
    path: [
      { columnKey: 'customer_type', label: 'Business', value: 'Business' },
    ],
  },
};

const detailRow: TestRow = {
  customer_type: 'Business',
  order_id: 7,
  total_amount: 4200,
};

const attachScrollMetrics = (container: HTMLDivElement | null) => {
  if (!container) return;
  if (Object.getOwnPropertyDescriptor(container, 'scrollTop')) return;

  Object.defineProperties(container, {
    clientHeight: { configurable: true, value: CONTAINER_HEIGHT },
    offsetHeight: { configurable: true, value: CONTAINER_HEIGHT },
    scrollTop: { configurable: true, value: 0, writable: true },
  });
};

type HarnessProps = {
  readonly rows: readonly TestRow[];
};

const Harness = ({ rows }: HarnessProps) => {
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
          crud: { delete: true, read: true, update: true },
          deleteActionPath: '/_action/delete',
          groupingAggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
          groupingKeys: GROUPING_KEYS,
          overscan: 2,
          rowHeight: ROW_HEIGHT,
          title: { plural: 'Orders', singular: 'Order' },
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

const renderGrid = (rows: readonly TestRow[]) =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        { element: <Harness rows={rows} />, path: '/' },
        { action: () => ({ ok: true }), path: '/_action/persist-cookie' },
        { action: () => ({ ok: true }), path: '/_action/delete' },
      ])}
    />,
  );

afterEach(cleanup);

describe('a grouped grid with row actions', () => {
  it('renders a group row without asking it for a row id', () => {
    expect(() => renderGrid([groupRow])).not.toThrow();
    expect(screen.getAllByTestId('table-group-header-row')).toHaveLength(1);
  });

  it('survives a group row whose aggregate lost its value to JSON', () => {
    const starved: TestRow = {
      [TABLE_GROUP_ROW_FIELD]: {
        ...(groupRow[TABLE_GROUP_ROW_FIELD] as Record<string, unknown>),
        aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
      },
    };

    renderGrid([starved]);

    expect({
      menus: screen.queryAllByLabelText('Row actions').length,
      rows: screen.queryAllByRole('row').length,
      titled: document.querySelectorAll('tbody [role="gridcell"] span[title]')
        .length,
    }).toStrictEqual({ menus: 0, rows: 2, titled: 0 });
  });

  it('gives a detail row with no primary key no menu, not no application', () => {
    const idless: TestRow = { customer_type: 'Business', total_amount: 4200 };

    renderGrid([groupRow, detailRow, idless]);

    expect({
      menus: screen.queryAllByLabelText('Row actions').length,
      rows: screen.queryAllByRole('row').length,
    }).toStrictEqual({ menus: 1, rows: 4 });
  });

  it('renders a detail row, which does carry a row id', () => {
    expect(() => renderGrid([groupRow, detailRow])).not.toThrow();
    expect(screen.getAllByLabelText('Row actions').length).toBeGreaterThan(0);
  });
});
