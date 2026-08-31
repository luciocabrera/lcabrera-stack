import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table';
import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { resolveLoaderGrouping } from './resolveLoaderGrouping.util';

const ABSENT_PARAM = new URLSearchParams().get('grouping');

type Row = { readonly order_status: string; readonly region: string };

const COLUMNS: readonly TableColumn<Row>[] = [
  { isGroupable: true, key: 'order_status', label: 'Status' },
  { isGroupable: true, key: 'region', label: 'Region' },
];

const DEFAULT_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: ['order_status'],
  mode: 'rollup',
  periods: {},
  shares: [],
};

describe('resolveLoaderGrouping', () => {
  it('applies the route default when the URL carried no grouping param', () => {
    expect(
      resolveLoaderGrouping<Row>({
        columns: COLUMNS,
        defaultGrouping: DEFAULT_GROUPING,
        param: ABSENT_PARAM,
      }),
    ).toStrictEqual(DEFAULT_GROUPING);
  });

  it('leaves a route with no default ungrouped on the same absent param', () => {
    expect(
      resolveLoaderGrouping<Row>({ columns: COLUMNS, param: ABSENT_PARAM }),
    ).toStrictEqual({
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('does NOT re-apply the default over an explicitly cleared grouping', () => {
    expect(
      resolveLoaderGrouping<Row>({
        columns: COLUMNS,
        defaultGrouping: DEFAULT_GROUPING,
        param: '{"keys":[]}',
      }),
    ).toStrictEqual({
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('prefers the URL over the default when the URL names keys', () => {
    expect(
      resolveLoaderGrouping<Row>({
        columns: COLUMNS,
        defaultGrouping: DEFAULT_GROUPING,
        param: '{"keys":["region"]}',
      }).keys,
    ).toStrictEqual(['region']);
  });

  it('sanitizes the default against the route columns, refusing it whole', () => {
    expect(
      resolveLoaderGrouping<Row>({
        columns: COLUMNS,
        defaultGrouping: {
          aggregates: [],
          keys: ['no_such_column'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        param: ABSENT_PARAM,
      }).keys,
    ).toStrictEqual([]);
  });

  it('groups nothing when the route declared no columns', () => {
    expect(
      resolveLoaderGrouping<Row>({
        defaultGrouping: DEFAULT_GROUPING,
        param: ABSENT_PARAM,
      }).keys,
    ).toStrictEqual([]);
  });
});
