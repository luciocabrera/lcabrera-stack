import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

import { resolveColumnGroupingChoices } from './resolveColumnGroupingChoices.util';

type Row = Record<string, unknown>;

const amount: TableColumn<Row> = {
  dataType: 'number',
  key: 'amount',
  label: 'Amount',
};

const capability = (
  overrides: Partial<TableColumnGroupingCapability> = {},
): TableColumnGroupingCapability =>
  ({
    aggregates: ['sum', 'avg'],
    canGroup: true,
    column: 'amount',
    periods: [],
    role: 'measure',
    typeName: 'numeric',
    ...overrides,
  }) as TableColumnGroupingCapability;

type ChoiceValuesArgs<TData> = Parameters<
  typeof resolveColumnGroupingChoices<TData>
>[0];

const choiceValues = <TData>(args: ChoiceValuesArgs<TData>) =>
  resolveColumnGroupingChoices<TData>(args).map((choice) => choice.value);

describe('resolveColumnGroupingChoices', () => {
  it('offers the group key first, then every aggregate the column supports', () => {
    expect(
      choiceValues<Row>({
        aggregates: [],
        capability: capability(),
        column: amount,
        groupingKeys: ['region'],
      }),
    ).toStrictEqual(['group-key', 'sum', 'avg']);
  });

  it('drops an aggregate already applied to that column', () => {
    expect(
      choiceValues<Row>({
        aggregates: [{ columnKey: 'amount', fn: 'sum' }],
        capability: capability(),
        column: amount,
        groupingKeys: ['region'],
      }),
    ).toStrictEqual(['group-key', 'avg']);
  });

  it('withholds the group key at the depth cap', () => {
    const cappedKeys = Array.from(
      { length: MAX_TABLE_GROUP_KEYS },
      (_unused, index) => `key_${String(index)}`,
    );

    expect(
      choiceValues<Row>({
        aggregates: [],
        capability: capability(),
        column: amount,
        groupingKeys: cappedKeys,
      }),
    ).toStrictEqual(['sum', 'avg']);
  });

  it('offers nothing for a column that can be neither', () => {
    expect(
      resolveColumnGroupingChoices<Row>({
        aggregates: [],
        capability: capability({ aggregates: [] }),
        column: { ...amount, isGroupable: false },
        groupingKeys: ['region'],
      }),
    ).toStrictEqual([]);
  });

  it('offers nothing for a column this route does not declare', () => {
    expect(
      resolveColumnGroupingChoices<Row>({
        aggregates: [],
        capability: capability(),
        column: undefined,
        groupingKeys: ['region'],
      }),
    ).toStrictEqual([]);
  });
});
