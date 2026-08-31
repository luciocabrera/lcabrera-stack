import { describe, expect, it } from 'vite-plus/test';

import { orderColumnsByKeys } from './orderColumnsByKeys.util';

const columns = [
  { key: 'a' as const, label: 'A' },
  { key: 'b' as const, label: 'B' },
  { key: 'c' as const, label: 'C' },
];

const keysOf = (result: readonly { readonly key: string }[]) =>
  result.map((col) => col.key);

describe('orderColumnsByKeys', () => {
  it('follows the requested order', () => {
    const result = orderColumnsByKeys({
      columnOrder: ['c', 'a', 'b'],
      columns,
    });

    expect(keysOf(result)).toEqual(['c', 'a', 'b']);
  });

  it('appends unmentioned columns in their original relative order', () => {
    const result = orderColumnsByKeys({ columnOrder: ['c'], columns });

    expect(keysOf(result)).toEqual(['c', 'a', 'b']);
  });

  it('drops an order key that matches no column', () => {
    const result = orderColumnsByKeys({
      columnOrder: ['missing' as 'a', 'b'],
      columns,
    });

    expect(keysOf(result)).toEqual(['b', 'a', 'c']);
  });

  it('emits a duplicated order key once per occurrence, as find() did', () => {
    const result = orderColumnsByKeys({ columnOrder: ['a', 'a'], columns });

    expect(keysOf(result)).toEqual(['a', 'a', 'b', 'c']);
  });

  it('returns the columns untouched for an empty order', () => {
    const result = orderColumnsByKeys({ columnOrder: [], columns });

    expect(keysOf(result)).toEqual(['a', 'b', 'c']);
  });
});
