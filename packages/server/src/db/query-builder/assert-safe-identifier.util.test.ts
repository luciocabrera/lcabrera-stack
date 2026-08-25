import { describe, expect, it } from 'vite-plus/test';

import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';

describe('assertSafeIdentifier', () => {
  it.each(['order_id', 'v_order_totals', '_leading_underscore', 'a'])(
    'accepts a valid identifier: %s',
    (identifier) => {
      expect(() => assertSafeIdentifier(identifier)).not.toThrow();
    },
  );

  it.each([
    'foo;bar',
    'foo bar',
    'foo"bar',
    'SELECT * FROM x',
    '',
    '123abc',
    'foo-bar',
    'foo.bar',
    '*',
  ])('rejects an unsafe identifier: %s', (identifier) => {
    expect(() => assertSafeIdentifier(identifier)).toThrow();
  });
});
