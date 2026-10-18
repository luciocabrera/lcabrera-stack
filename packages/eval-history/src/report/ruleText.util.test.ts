import { describe, expect, it } from 'vite-plus/test';

import type { Regression } from './report.types.ts';

import { REGRESSION_NEEDS_DATABASE } from './report.constants.ts';
import { ruleText } from './ruleText.util.ts';

const text = (rule: Regression['rule']) =>
  ruleText({
    labels: { a: 'main', b: 'feat/x' },
    minTrialsForRate: 6,
    rule,
    suite: 'skills',
  });

describe('ruleText', () => {
  it('says nothing was flagged', () => {
    expect(text({ kind: 'clear' })).toBe('Regression rule: nothing flagged.');
  });

  it('names the model with no baseline', () => {
    expect(text({ kind: 'no-baseline', modelId: 'model-b' })).toContain(
      'no baseline for model-b, so nothing is flagged',
    );
  });

  it('names what it could not judge', () => {
    expect(text({ kind: 'insufficient', unjudged: ['skill:epic'] })).toContain(
      'Could not judge `skill:epic`',
    );
    expect(text({ kind: 'insufficient', unjudged: [] })).toContain(
      'A pass rate needs 6 counted trials on each side.',
    );
  });

  it('says why the rule was not applied', () => {
    expect(text({ kind: 'needs-database' })).toBe(REGRESSION_NEEDS_DATABASE);
    expect(text({ kind: 'incomparable', reason: 'harness-changed' })).toContain(
      '--allow-harness-change',
    );
  });

  it('heads a regression with its subjects', () => {
    expect(
      text({
        findings: [
          { kind: 'mean', mean: 3, subject: undefined, threshold: 3.5 },
        ],
        kind: 'regression',
      }),
    ).toMatch(/^\*\*Regression flagged\*\* in the suite as a whole:\n- /u);
  });
});
