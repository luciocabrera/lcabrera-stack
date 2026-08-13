import { describe, expect, it } from 'vite-plus/test';

import { serializeGroupingToURL } from './serializeGroupingToURL.util';

describe('serializeGroupingToURL', () => {
  it('serializes a group key to the compact param', () => {
    expect(
      serializeGroupingToURL({ aggregates: {}, keys: ['order_status'] }),
    ).toBe('{"keys":["order_status"]}');
  });

  it('preserves key order', () => {
    expect(serializeGroupingToURL({ aggregates: {}, keys: ['b', 'a'] })).toBe(
      '{"keys":["b","a"]}',
    );
  });

  it('carries the selected aggregates beside the keys', () => {
    expect(
      serializeGroupingToURL({
        aggregates: { total_amount: 'sum' },
        keys: ['order_status'],
      }),
    ).toBe('{"agg":{"total_amount":"sum"},"keys":["order_status"]}');
  });

  it('leaves `agg` out entirely when nothing is selected', () => {
    // A grouped table with no aggregate produces exactly the param it produced
    // before aggregates existed, so an old shared link and a new one agree.
    expect(serializeGroupingToURL({ aggregates: {}, keys: ['a'] })).toBe(
      '{"keys":["a"]}',
    );
  });

  it('returns undefined for no keys, so the param leaves the URL', () => {
    expect(
      serializeGroupingToURL({ aggregates: {}, keys: [] }),
    ).toBeUndefined();
  });

  it('returns undefined for aggregates with no key to group by', () => {
    expect(
      serializeGroupingToURL({ aggregates: { total_amount: 'sum' }, keys: [] }),
    ).toBeUndefined();
  });
});
