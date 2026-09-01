import { describe, expect, it } from 'vite-plus/test';

import { isUniqueIsh } from './is-unique-ish.util.ts';

describe('isUniqueIsh', () => {
  it('flags a column with one distinct value per row', () => {
    expect(
      isUniqueIsh({
        estimate: { kind: 'known', value: 2000 },
        relTuples: 2000,
      }),
    ).toBe(true);
  });

  it('flags a near-unique column, since n_distinct is an estimate', () => {
    expect(
      isUniqueIsh({
        estimate: { kind: 'known', value: 1960 },
        relTuples: 2000,
      }),
    ).toBe(true);
  });

  it('leaves a genuine dimension alone', () => {
    expect(
      isUniqueIsh({ estimate: { kind: 'known', value: 24 }, relTuples: 2000 }),
    ).toBe(false);
  });

  it('does not flag an unknown estimate', () => {
    expect(
      isUniqueIsh({ estimate: { kind: 'unknown' }, relTuples: 2000 }),
    ).toBe(false);
  });

  it('does not flag every column on an empty relation', () => {
    expect(
      isUniqueIsh({ estimate: { kind: 'known', value: 3 }, relTuples: 0 }),
    ).toBe(false);
  });
});
