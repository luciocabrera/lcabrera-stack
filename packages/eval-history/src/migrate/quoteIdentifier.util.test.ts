import { describe, expect, it } from 'vite-plus/test';

import { quoteIdentifier } from './quoteIdentifier.util.ts';

describe('quoteIdentifier', () => {
  it('wraps a plain name in double quotes', () => {
    expect(quoteIdentifier('evals_writer')).toBe('"evals_writer"');
  });

  it('doubles every double quote inside the name', () => {
    expect(quoteIdentifier('odd"na"me')).toBe('"odd""na""me"');
  });
});
