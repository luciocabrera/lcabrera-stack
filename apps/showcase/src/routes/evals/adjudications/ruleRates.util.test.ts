import { describe, expect, it } from 'vite-plus/test';

import { CASES } from './adjudications.fixtures';
import { ruleRates } from './ruleRates.util';

describe('ruleRates', () => {
  it('counts cases, dismissals, true answers and false positives per rule, busiest first', () => {
    expect(ruleRates(CASES)).toEqual([
      {
        analyzer: 'biome',
        answered: 2,
        cases: 2,
        dismissed: 2,
        falsePositives: 1,
        id: 'biome/lint/a11y/noNoninteractiveElementToInteractiveRole',
        rate: '50% (1/2)',
        reopened: 1,
        rule: 'lint/a11y/noNoninteractiveElementToInteractiveRole',
      },
      {
        analyzer: 'fallow',
        answered: 1,
        cases: 1,
        dismissed: 0,
        falsePositives: 0,
        id: 'fallow/complexity',
        rate: '0% (0/1)',
        reopened: 0,
        rule: 'complexity',
      },
      {
        analyzer: 'oxlint',
        answered: 0,
        cases: 1,
        dismissed: 0,
        falsePositives: 0,
        id: 'oxlint/unicorn/no-nested-ternary',
        rate: 'no true answer yet',
        reopened: 0,
        rule: 'unicorn/no-nested-ternary',
      },
    ]);
  });

  it('lists no rule without a case', () => {
    expect(ruleRates([])).toEqual([]);
  });
});
