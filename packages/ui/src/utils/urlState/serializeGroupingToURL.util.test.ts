import { describe, expect, it } from 'vite-plus/test';

import { serializeGroupingToURL } from './serializeGroupingToURL.util';

describe('serializeGroupingToURL', () => {
  it('serializes a group key to the compact param', () => {
    expect(serializeGroupingToURL(['order_status'])).toBe(
      '{"keys":["order_status"]}',
    );
  });

  it('preserves key order', () => {
    expect(serializeGroupingToURL(['b', 'a'])).toBe('{"keys":["b","a"]}');
  });

  it('returns undefined for no keys, so the param leaves the URL', () => {
    expect(serializeGroupingToURL([])).toBeUndefined();
  });
});
