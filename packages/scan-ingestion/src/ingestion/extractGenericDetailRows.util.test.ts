import { describe, expect, it } from 'vitest';

import { extractGenericDetailRows } from './extractGenericDetailRows.util.ts';

describe('extractGenericDetailRows', () => {
  it('prefers the top-level rows array (the scaffolded-runner contract)', () => {
    expect(
      extractGenericDetailRows({
        rawJson: { kind: 'cycle-finder', rows: [{ a: 1 }, { a: 2 }] },
      }),
    ).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('takes a bare array as the rows themselves', () => {
    expect(extractGenericDetailRows({ rawJson: [{ b: 1 }] })).toEqual([
      { b: 1 },
    ]);
  });

  it('degrades anything else to a single whole-artifact row', () => {
    expect(
      extractGenericDetailRows({ rawJson: { kind: 'x', rows: 'not-array' } }),
    ).toEqual([{ kind: 'x', rows: 'not-array' }]);
    expect(extractGenericDetailRows({ rawJson: 42 })).toEqual([42]);
  });
});
