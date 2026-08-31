import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveColumnLayoutLock } from './resolveColumnLayoutLock.util';

type Row = {
  readonly amount: number;
  readonly region: string;
};

const columns: readonly TableColumn<Row>[] = [
  { dataType: 'number', key: 'amount', label: 'Amount' },
  { key: 'region', label: 'Region' },
];

type RunArgs = {
  readonly columnKey: string;
  readonly groupingKeys?: readonly string[];
};

const run = ({ columnKey, groupingKeys = [] }: RunArgs) =>
  resolveColumnLayoutLock<Row>({
    columnKey: columnKey as never,
    columns,
    groupingKeys,
  });

describe('resolveColumnLayoutLock', () => {
  it('locks an applied group key', () => {
    expect(run({ columnKey: 'region', groupingKeys: ['region'] })).toBe(
      'group-key',
    );
  });

  it('locks a measure, which carries the pinning of the column it measures', () => {
    expect(run({ columnKey: 'amount:sum', groupingKeys: ['region'] })).toBe(
      'measure',
    );
  });

  it('leaves an ordinary column unlocked', () => {
    expect(
      run({ columnKey: 'amount', groupingKeys: ['region'] }),
    ).toBeUndefined();
  });

  it('leaves every column unlocked when no grouping is applied', () => {
    expect(run({ columnKey: 'region' })).toBeUndefined();
    expect(run({ columnKey: 'amount' })).toBeUndefined();
  });

  it('reads a declared column named like a token as the column, not a measure', () => {
    expect(
      resolveColumnLayoutLock<Row>({
        columnKey: 'amount:sum' as never,
        columns: [...columns, { key: 'amount:sum' as never, label: 'Odd' }],
        groupingKeys: ['region'],
      }),
    ).toBeUndefined();
  });

  it('prefers the group-key lock when a key is somehow also token-shaped', () => {
    expect(run({ columnKey: 'amount:sum', groupingKeys: ['amount:sum'] })).toBe(
      'group-key',
    );
  });
});
