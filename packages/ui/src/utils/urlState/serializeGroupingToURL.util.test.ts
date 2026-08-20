import { describe, expect, it } from 'vite-plus/test';

import { serializeGroupingToURL } from './serializeGroupingToURL.util';

describe('serializeGroupingToURL', () => {
  it('serializes a group key to the compact param', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toBe('{"keys":["order_status"]}');
  });

  it('preserves key order', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [],
          keys: ['b', 'a'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toBe('{"keys":["b","a"]}');
  });

  it('carries the selected aggregates beside the keys', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toBe('{"agg":["total_amount:sum"],"keys":["order_status"]}');
  });

  it('leaves `agg` out entirely when nothing is selected', () => {
    // A grouped table with no aggregate produces exactly the param it produced
    // before aggregates existed, so an old shared link and a new one agree.
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [],
          keys: ['a'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toBe('{"keys":["a"]}');
  });

  it('returns undefined for no keys, so the param leaves the URL', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [],
          keys: [],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toBeUndefined();
  });

  it('returns undefined for aggregates with no key to group by', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
          keys: [],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toBeUndefined();
  });

  it('drops the param entirely for an empty grouping', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [],
          keys: [],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toBeUndefined();
  });

  it('writes the empty envelope instead where a default grouping exists', () => {
    // An absent param is what the loader reads as "apply the route default", so
    // on such a route "off" has to be something the URL can say — otherwise
    // clearing is undone by the next navigation that writes any other param
    // (#578).
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [],
          keys: [],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        keepWhenEmpty: true,
      }),
    ).toBe('{"keys":[]}');
  });

  it('is unchanged by the flag whenever keys are applied', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        keepWhenEmpty: true,
      }),
    ).toBe('{"keys":["order_status"]}');
  });

  it('carries the shares beside the keys', () => {
    // Round-tripped rather than asserted piecewise: the narrowing accepting a
    // member and the serializer emitting it are two different halves, and a
    // share that never reaches the URL never reaches the loader either — so the
    // selection would survive exactly until the next navigation (#648).
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [{ columnKey: 'revenue', fn: 'sum' }],
          keys: ['status'],
          mode: 'flat',
          periods: {},
          shares: [{ columnKey: 'revenue', fn: 'sum' }],
        },
      }),
    ).toBe('{"agg":["revenue:sum"],"keys":["status"],"share":["revenue:sum"]}');
  });

  it('leaves `share` out entirely when nothing is showing one', () => {
    // A grouped table with no share produces exactly the param it produced
    // before shares existed.
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: [],
          keys: ['status'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }),
    ).toBe('{"keys":["status"]}');
  });
});
