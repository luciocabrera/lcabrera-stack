// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, test } from 'vite-plus/test';

import type {
  TableColumn,
  TableLayoutMode,
} from '#ui/components/Table/Table.types';

import { Table } from '#ui/components/Table/Table.component';

type Row = {
  readonly delta: number;
  readonly id: number;
  readonly label: string;
  readonly total: number;
};

const TABLE_COUNT = 12;

const ROW_COUNT = 8;

const COLUMNS: readonly TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { dataType: 'string', key: 'label', label: 'Label' },
  { dataType: 'number', key: 'total', label: 'Total' },
  { dataType: 'number', key: 'delta', label: 'Delta' },
];

const TABLES = Array.from({ length: TABLE_COUNT }, (_unused, table) => ({
  name: `Table ${table}`,
  rows: Array.from({ length: ROW_COUNT }, (_row, id) => ({
    delta: id - table,
    id,
    label: `Row ${table}.${id}`,
    total: table * 100 + id,
  })),
}));

Object.assign(HTMLElement.prototype, {
  hidePopover: () => undefined,
  scrollTo: () => undefined,
  showPopover: () => undefined,
});

const sink = { total: 0 };

const renderPage = (layout: TableLayoutMode) => (
  <main>
    {TABLES.map(({ name, rows }) => (
      <Table
        caption={name}
        columns={COLUMNS}
        key={name}
        layout={layout}
        response={rows}
        title={name}
      />
    ))}
  </main>
);

describe(`${TABLE_COUNT} tables of ${ROW_COUNT} rows on one page`, () => {
  test('client mount and unmount', async ({ bench }) => {
    const virtual = bench('virtual (current)', () => {
      const view = render(renderPage('virtual'));

      sink.total += view.container.querySelectorAll('tr').length;
      view.unmount();
    });
    const staticLayout = bench('static', () => {
      const view = render(renderPage('static'));

      sink.total += view.container.querySelectorAll('tr').length;
      view.unmount();
    });

    await bench.compare(virtual, staticLayout);
  });

  test('server render', async ({ bench }) => {
    const virtual = bench('virtual (current)', () => {
      sink.total += renderToString(renderPage('virtual')).length;
    });
    const staticLayout = bench('static', () => {
      sink.total += renderToString(renderPage('static')).length;
    });

    await bench.compare(virtual, staticLayout);
  });
});
