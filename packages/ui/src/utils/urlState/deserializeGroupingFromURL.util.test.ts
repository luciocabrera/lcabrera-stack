import { describe, expect, it } from 'vite-plus/test';

import { deserializeGroupingFromURL } from './deserializeGroupingFromURL.util';
import { serializeGroupingToURL } from './serializeGroupingToURL.util';

describe('deserializeGroupingFromURL', () => {
  it('reads the keys back out of a compact param', () => {
    expect(
      deserializeGroupingFromURL('{"keys":["order_status"]}'),
    ).toStrictEqual(['order_status']);
  });

  it('round-trips what serializeGroupingToURL wrote', () => {
    const param = serializeGroupingToURL(['order_status']);

    expect(param).toBeDefined();
    expect(deserializeGroupingFromURL(param ?? '')).toStrictEqual([
      'order_status',
    ]);
  });

  it('answers no keys for a malformed param', () => {
    expect(deserializeGroupingFromURL('{not-json')).toStrictEqual([]);
    expect(deserializeGroupingFromURL('{"keys":[3]}')).toStrictEqual([]);
  });
});
