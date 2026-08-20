import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table';
import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { resolveLoaderGrouping } from './resolveLoaderGrouping.util';

/**
 * What `URLSearchParams.get` answers for a param the URL does not carry — read
 * from the API rather than written as a literal, so the fixture is the value
 * the loader actually receives rather than a stand-in for it.
 */
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
    // The empty envelope is what the clear path writes on a route that has a
    // default, and it is the whole reason the raw param is threaded here: it
    // deserializes to the same `keys: []` an absent param would, so anything
    // reading the parsed state alone would put the preset back and undo the
    // user's clear on the next navigation (#578).
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
    // A preset is the one grouping nobody has to type to run into, so a key
    // naming a column this route no longer declares must not reach SQL.
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
