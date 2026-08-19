import { describe, expect, it } from 'vite-plus/test';

import { serializeGroupingToURL } from './serializeGroupingToURL.util';

describe('serializeGroupingToURL', () => {
  it('serializes a group key to the compact param', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: {},
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
        },
      }),
    ).toBe('{"keys":["order_status"]}');
  });

  it('preserves key order', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: {},
          keys: ['b', 'a'],
          mode: 'flat',
          periods: {},
        },
      }),
    ).toBe('{"keys":["b","a"]}');
  });

  it('carries the selected aggregates beside the keys', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: { total_amount: 'sum' },
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
        },
      }),
    ).toBe('{"agg":{"total_amount":"sum"},"keys":["order_status"]}');
  });

  it('leaves `agg` out entirely when nothing is selected', () => {
    // A grouped table with no aggregate produces exactly the param it produced
    // before aggregates existed, so an old shared link and a new one agree.
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: {},
          keys: ['a'],
          mode: 'flat',
          periods: {},
        },
      }),
    ).toBe('{"keys":["a"]}');
  });

  it('returns undefined for no keys, so the param leaves the URL', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: {},
          keys: [],
          mode: 'flat',
          periods: {},
        },
      }),
    ).toBeUndefined();
  });

  it('returns undefined for aggregates with no key to group by', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: { total_amount: 'sum' },
          keys: [],
          mode: 'flat',
          periods: {},
        },
      }),
    ).toBeUndefined();
  });

  it('drops the param entirely for an empty grouping', () => {
    expect(
      serializeGroupingToURL({
        grouping: { aggregates: {}, keys: [], mode: 'flat', periods: {} },
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
        grouping: { aggregates: {}, keys: [], mode: 'flat', periods: {} },
        keepWhenEmpty: true,
      }),
    ).toBe('{"keys":[]}');
  });

  it('is unchanged by the flag whenever keys are applied', () => {
    expect(
      serializeGroupingToURL({
        grouping: {
          aggregates: {},
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
        },
        keepWhenEmpty: true,
      }),
    ).toBe('{"keys":["order_status"]}');
  });
});
