import { describe, expect, it } from 'vitest';

import { quoteIdentifier } from './quote-identifier.util.ts';

describe('quoteIdentifier', () => {
  it('wraps a plain identifier in double quotes', () => {
    expect(quoteIdentifier('scanner_id')).toBe('"scanner_id"');
  });

  it('doubles an embedded double quote', () => {
    expect(quoteIdentifier('weird"name')).toBe('"weird""name"');
  });
});
