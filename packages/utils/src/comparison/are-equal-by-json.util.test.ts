import { describe, expect, it } from 'vitest';

import { areEqualByJson } from './are-equal-by-json.util';

type TestObject = {
  readonly id: number;
  readonly meta?: {
    readonly tag: string;
  };
};

describe('areEqualByJson', () => {
  it('returns true when objects are structurally equal', () => {
    expect(
      areEqualByJson<TestObject>({
        left: { id: 1, meta: { tag: 'a' } },
        right: { id: 1, meta: { tag: 'a' } },
      }),
    ).toBe(true);
  });

  it('returns false when objects differ', () => {
    expect(
      areEqualByJson<TestObject>({
        left: { id: 1, meta: { tag: 'a' } },
        right: { id: 2, meta: { tag: 'b' } },
      }),
    ).toBe(false);
  });

  it('returns true when both values are undefined', () => {
    expect(
      areEqualByJson<TestObject>({
        left: undefined,
        right: undefined,
      }),
    ).toBe(true);
  });

  it('returns false when only one value is undefined', () => {
    expect(
      areEqualByJson<TestObject>({
        left: { id: 1 },
        right: undefined,
      }),
    ).toBe(false);
  });
});
