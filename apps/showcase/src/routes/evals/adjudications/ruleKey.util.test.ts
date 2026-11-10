import { describe, expect, it } from 'vite-plus/test';

import { ruleKey } from './ruleKey.util';

describe('ruleKey', () => {
  it('names a rule by its analyzer, so two analyzers never share a rule name', () => {
    expect(ruleKey({ analyzer: 'biome', rule: 'complexity' })).toBe(
      'biome/complexity',
    );
    expect(ruleKey({ analyzer: 'fallow', rule: 'complexity' })).toBe(
      'fallow/complexity',
    );
  });
});
