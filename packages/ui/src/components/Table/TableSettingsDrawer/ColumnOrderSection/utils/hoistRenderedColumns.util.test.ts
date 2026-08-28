import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { hoistRenderedColumns } from './hoistRenderedColumns.util';

type Row = Record<string, unknown>;

const columns: readonly TableColumn<Row>[] = [
  { key: 'id', label: 'Id' },
  { key: 'amount', label: 'Amount' },
  { key: 'region', label: 'Region' },
];

const keysOf = (result: readonly TableColumn<Row>[]) =>
  result.map((column) => String(column.key));

describe('hoistRenderedColumns', () => {
  it('lists the rendered columns first, in the order the grid paints them', () => {
    const result = hoistRenderedColumns<Row>({
      columns,
      groupingKeys: ['region'],
      renderedColumnKeys: ['region', 'amount'],
    });

    expect(keysOf(result)).toStrictEqual(['region', 'amount', 'id']);
  });

  it('leaves the consumer’s own order alone while no grouping is applied', () => {
    // Hoisting here would sink every hidden column to the bottom of the list,
    // and a drag would then persist that as the consumer's column order.
    const result = hoistRenderedColumns<Row>({
      columns,
      groupingKeys: [],
      renderedColumnKeys: ['region'],
    });

    expect(result).toBe(columns);
  });

  it('ignores a rendered key the section does not list', () => {
    const result = hoistRenderedColumns<Row>({
      columns,
      groupingKeys: ['region'],
      renderedColumnKeys: ['region', 'not_listed'],
    });

    expect(keysOf(result)).toStrictEqual(['region', 'id', 'amount']);
  });
});
