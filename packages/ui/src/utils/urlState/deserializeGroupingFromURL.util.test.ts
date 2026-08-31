import { describe, expect, it } from 'vite-plus/test';

import { deserializeGroupingFromURL } from './deserializeGroupingFromURL.util';
import { serializeGroupingToURL } from './serializeGroupingToURL.util';

const NO_GROUPING = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

describe('deserializeGroupingFromURL', () => {
  it('reads the keys back out of a compact param', () => {
    expect(
      deserializeGroupingFromURL('{"keys":["order_status"]}'),
    ).toStrictEqual({
      aggregates: [],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('reads several keys in the order the param carried them', () => {
    expect(
      deserializeGroupingFromURL('{"keys":["a","b","c"]}').keys,
    ).toStrictEqual(['a', 'b', 'c']);
  });

  it('reads the aggregates back out', () => {
    expect(
      deserializeGroupingFromURL(
        '{"agg":["total_amount:sum"],"keys":["order_status"]}',
      ),
    ).toStrictEqual({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('reads an absent mode as flat, which is what a pre-rollup link means', () => {
    expect(deserializeGroupingFromURL('{"keys":["order_status"]}').mode).toBe(
      'flat',
    );
    expect(
      deserializeGroupingFromURL('{"keys":["order_status"],"mode":"rollup"}')
        .mode,
    ).toBe('rollup');
  });

  it('round-trips what serializeGroupingToURL wrote', () => {
    const grouping = {
      aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
      keys: ['order_status', 'shipping_country'],
      mode: 'rollup',
      periods: {},
      shares: [],
    } as const;
    const param = serializeGroupingToURL({ grouping });

    expect(param).toBeDefined();
    expect(deserializeGroupingFromURL(param ?? '')).toStrictEqual(grouping);
  });

  it('round-trips a whole multi-aggregate configuration, shares included', () => {
    const grouping = {
      aggregates: [
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'count' },
        { columnKey: 'quantity', fn: 'avg' },
      ],
      keys: ['order_status', 'shipping_country'],
      mode: 'rollup',
      periods: {},
      shares: [{ columnKey: 'total_amount', fn: 'count' }],
    } as const;
    const param = serializeGroupingToURL({ grouping });

    expect(param).toBe(
      '{"agg":["total_amount:sum","total_amount:count","quantity:avg"],"keys":["order_status","shipping_country"],"mode":"rollup","share":["total_amount:count"]}',
    );
    expect(deserializeGroupingFromURL(param ?? '')).toStrictEqual(grouping);
  });

  it('round-trips a column key containing a colon', () => {
    const grouping = {
      aggregates: [{ columnKey: 'ns:total', fn: 'sum' }],
      keys: ['ns:status'],
      mode: 'flat',
      periods: {},
      shares: [{ columnKey: 'ns:total', fn: 'sum' }],
    } as const;
    const param = serializeGroupingToURL({ grouping });

    expect(deserializeGroupingFromURL(param ?? '')).toStrictEqual(grouping);
  });

  it('answers no grouping at all for a malformed param', () => {
    expect(deserializeGroupingFromURL('{not-json')).toStrictEqual(NO_GROUPING);
    expect(deserializeGroupingFromURL('{"keys":[3]}')).toStrictEqual(
      NO_GROUPING,
    );
  });

  it('drops the keys too when only the aggregates are malformed', () => {
    expect(
      deserializeGroupingFromURL(
        '{"agg":["total_amount:median"],"keys":["order_status"]}',
      ),
    ).toStrictEqual(NO_GROUPING);
  });

  it('drops the whole payload when one aggregate token of several is bad', () => {
    expect(
      deserializeGroupingFromURL(
        '{"agg":["total_amount:sum","total_amount:median"],"keys":["order_status"]}',
      ),
    ).toStrictEqual(NO_GROUPING);
  });

  it('drops the whole payload when only the share is unreadable', () => {
    expect(
      deserializeGroupingFromURL(
        '{"agg":["total_amount:sum"],"keys":["order_status"],"share":["total_amount"]}',
      ),
    ).toStrictEqual(NO_GROUPING);
  });
});
