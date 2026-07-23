import { describe, expect, it } from 'vite-plus/test';

import { readQueryInteger } from './readQueryInteger.util';

describe('readQueryInteger', () => {
  it('returns the fallback when the query value is missing or invalid', () => {
    expect(
      readQueryInteger({
        fallback: 25,
        value: undefined,
      }),
    ).toBe(25);
    expect(
      readQueryInteger({
        fallback: 25,
        value: 'not-a-number',
      }),
    ).toBe(25);
  });

  it('parses the integer and clamps it to the configured bounds', () => {
    expect(
      readQueryInteger({
        fallback: 25,
        max: 100,
        min: 10,
        value: '5',
      }),
    ).toBe(10);
    expect(
      readQueryInteger({
        fallback: 25,
        max: 100,
        min: 10,
        value: '150',
      }),
    ).toBe(100);
    expect(
      readQueryInteger({
        fallback: 25,
        max: 100,
        min: 10,
        value: '42',
      }),
    ).toBe(42);
  });
});
