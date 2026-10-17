import { describe, expect, it } from 'vite-plus/test';

import { isBaselineSuite } from './isBaselineSuite.util.ts';

describe('isBaselineSuite', () => {
  it('accepts the suites that call a model and nothing else', () => {
    expect(
      ['skills', 'skill-quality', 'verifier-fixtures', 'verifier-tooled'].every(
        isBaselineSuite,
      ),
    ).toBe(true);
    expect(isBaselineSuite('rules-consistency')).toBe(false);
    expect(isBaselineSuite('constructor')).toBe(false);
  });
});
