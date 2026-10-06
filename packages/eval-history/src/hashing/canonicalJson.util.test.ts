import { describe, expect, it } from 'vite-plus/test';

import { canonicalJson } from './canonicalJson.util.ts';

describe('canonicalJson', () => {
  it('sorts keys at every depth and writes no whitespace', () => {
    const unsorted: unknown = JSON.parse(
      '{ "b": [{ "d": 1, "c": 2 }], "a": { "f": false, "e": "x" } }',
    );

    expect(canonicalJson(unsorted)).toBe(
      '{"a":{"e":"x","f":false},"b":[{"c":2,"d":1}]}',
    );
  });

  it('keeps array order', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
  });
});
