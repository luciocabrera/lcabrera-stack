// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

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
const GROUP_DETAILS_PATH = '/orders/group';

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'order_id', label: 'Order' },
  { key: 'customer_type', label: 'Customer Type' },
  { key: 'status', label: 'Status' },
];

const groupRowOf = (summary: Partial<TableGroupRowSummary>): TestRow => ({
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [],
    count: 4,
    isSubtotal: false,
    path: [
      { columnKey: 'customer_type', label: 'Business', value: 'Business' },
      { columnKey: 'status', label: 'Shipped', value: 'Shipped' },
    ],
    ...summary,
  },
});

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
  readonly groupDetailsPath?: string;
  readonly groupingKeys: readonly string[];
  readonly rows: readonly TestRow[];
};

const Harness = ({ groupDetailsPath, groupingKeys, rows }: HarnessProps) => {
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
          groupingKeys,
          overscan: 2,
          rowHeight: ROW_HEIGHT,
          title: { plural: 'Orders', singular: 'Order' },
          ...(groupDetailsPath !== undefined && { groupDetailsPath }),
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

const renderGrid = ({
  groupDetailsPath = GROUP_DETAILS_PATH,
  groupingKeys = ['customer_type', 'status'],
  initialEntry = '/',
  rows,
}: {
  readonly groupDetailsPath?: string;
  readonly groupingKeys?: readonly string[];
  readonly initialEntry?: string;
  readonly rows: readonly TestRow[];
}) =>
  render(
    <RouterProvider
      router={createMemoryRouter(
        [
          {
            element: (
              <Harness
                groupingKeys={groupingKeys}
                rows={rows}
                {...(groupDetailsPath !== '' && { groupDetailsPath })}
              />
            ),
            path: '/',
          },
          { element: <div />, path: GROUP_DETAILS_PATH },
          { action: () => ({ ok: true }), path: '/_action/persist-cookie' },
        ],
        { initialEntries: [initialEntry] },
      )}
    />,
  );

const detailsLink = () => screen.queryByTestId('table-group-details-link');

const paramsOf = (href: null | string | undefined) =>
  new URL(href ?? '', 'http://table.test').searchParams;

afterEach(cleanup);

describe('opening a group from the grid', () => {
  it('links the innermost key to the group-details route', () => {
    renderGrid({ rows: [groupRowOf({})] });

    const link = detailsLink();

    expect(link).not.toBeNull();
    expect(
      new URL(link?.getAttribute('href') ?? '', 'http://table.test'),
    ).toMatchObject({ pathname: GROUP_DETAILS_PATH });
  });

  it('names the whole group path in the link', () => {
    renderGrid({ rows: [groupRowOf({})] });

    const group = paramsOf(detailsLink()?.getAttribute('href')).get('group');

    expect(JSON.parse(group ?? '{}')).toStrictEqual({
      isSubtotal: false,
      keys: ['customer_type', 'status'],
      path: [
        { columnKey: 'customer_type', value: 'Business' },
        { columnKey: 'status', value: 'Shipped' },
      ],
    });
  });

  it('carries the list filters the group was counted under', () => {
    renderGrid({
      initialEntry: '/?filters=%7B%22status%22%3A1%7D',
      rows: [groupRowOf({})],
    });

    expect(paramsOf(detailsLink()?.getAttribute('href')).get('filters')).toBe(
      '{"status":1}',
    );
  });

  it('adds no tab stop to the grid', () => {
    renderGrid({ rows: [groupRowOf({})] });

    expect(detailsLink()?.getAttribute('tabindex')).toBe('-1');
  });

  it('links the innermost level only, not every key cell on the row', () => {
    renderGrid({ rows: [groupRowOf({})] });

    expect(screen.getAllByTestId('table-group-details-link')).toHaveLength(1);
  });

  it('offers no link on a subtotal', () => {
    renderGrid({ rows: [groupRowOf({ isSubtotal: true })] });

    expect(detailsLink()).toBeNull();
  });

  it('offers no link on an outer level', () => {
    renderGrid({
      rows: [
        groupRowOf({
          path: [
            {
              columnKey: 'customer_type',
              label: 'Business',
              value: 'Business',
            },
          ],
        }),
      ],
    });

    expect(detailsLink()).toBeNull();
  });

  it('still renders the key text where the route serves no group details', () => {
    renderGrid({ groupDetailsPath: '', rows: [groupRowOf({})] });

    expect(detailsLink()).toBeNull();
    expect(screen.getAllByText('Shipped').length).toBeGreaterThan(0);
  });
});
