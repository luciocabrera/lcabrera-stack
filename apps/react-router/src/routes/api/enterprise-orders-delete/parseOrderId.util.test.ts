import { describe, expect, it } from 'vite-plus/test';

import { parseOrderId } from './parseOrderId.util';

type ThrownData = {
  readonly data: { readonly error: string };
  readonly init: null | { readonly status: number };
};

const catchThrown = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error as ThrownData;
  }
  throw new Error('expected parseOrderId to throw');
};

describe('parseOrderId', () => {
  it('returns the numeric id for a valid value', () => {
    expect(parseOrderId('42')).toBe(42);
  });

  it('throws a 400 response for a missing value', () => {
    const missingValue = new FormData().get('id');
    const thrown = catchThrown(() => parseOrderId(missingValue));

    expect(thrown.data.error).toBe('Missing order id');
    expect(thrown.init?.status).toBe(400);
  });

  it('throws a 400 response for an empty string', () => {
    const thrown = catchThrown(() => parseOrderId(''));

    expect(thrown.data.error).toBe('Missing order id');
    expect(thrown.init?.status).toBe(400);
  });

  it('throws a 400 response for non-numeric, non-integer, or non-positive ids', () => {
    for (const value of ['abc', '1.5', '0', '-3']) {
      const thrown = catchThrown(() => parseOrderId(value));

      expect(thrown.data.error).toBe('Invalid order id');
      expect(thrown.init?.status).toBe(400);
    }
  });
});
