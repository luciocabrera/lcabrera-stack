import { describe, expect, it } from 'vite-plus/test';

import { quoteIdentifier } from './quote-identifier.util.ts';

describe('quoteIdentifier', () => {
  it('wraps a plain identifier in double quotes', () => {
    expect(quoteIdentifier('order_id')).toBe('"order_id"');
  });

  it('doubles an embedded double quote', () => {
    expect(quoteIdentifier('weird"name')).toBe('"weird""name"');
  });
});
