import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveGroupedSortScope } from './resolveGroupedSortScope.util';

type Row = {
  readonly region: string;
  readonly status: string;
  readonly total_amount: number;
};

const columns: readonly TableColumn<Row>[] = [
  { key: 'region', label: 'Region' },
  { key: 'status', label: 'Status' },
  { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
];

describe('resolveGroupedSortScope', () => {
  it('answers nothing when no key is applied, leaving an ungrouped grid unscoped', () => {
    expect(
      resolveGroupedSortScope<Row>({
        aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
        columns,
        groupingKeys: [],
      }),
    ).toBeUndefined();
  });

  it('answers nothing when every applied key is undeclared', () => {
    expect(
      resolveGroupedSortScope<Row>({
        aggregates: [],
        columns,
        groupingKeys: ['gone'],
      }),
    ).toBeUndefined();
  });

  it('scopes to the declared keys and the staged measure tokens', () => {
    expect(
      resolveGroupedSortScope<Row>({
        aggregates: [
          { columnKey: 'total_amount', fn: 'sum' },
          { columnKey: 'total_amount', fn: 'avg' },
        ],
        columns,
        groupingKeys: ['region'],
      }),
    ).toEqual(new Set(['region', 'total_amount:avg', 'total_amount:sum']));
  });

  it('drops an undeclared key from a grouping that also names a declared one', () => {
    expect(
      resolveGroupedSortScope<Row>({
        aggregates: [],
        columns,
        groupingKeys: ['region', 'gone'],
      }),
    ).toEqual(new Set(['region']));
  });

  it('leaves out a column that is neither a key nor measured', () => {
    const scope = resolveGroupedSortScope<Row>({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      columns,
      groupingKeys: ['region'],
    });

    expect(scope?.has('status')).toBe(false);
    expect(scope?.has('total_amount')).toBe(false);
  });
});
