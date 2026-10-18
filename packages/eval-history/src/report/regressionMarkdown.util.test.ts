import { describe, expect, it } from 'vite-plus/test';

import type { Regression } from './report.types.ts';

import { regressionMarkdown } from './regressionMarkdown.util.ts';
import { REGRESSION_NEEDS_DATABASE } from './report.constants.ts';

const labels = { a: 'main', b: 'feat/x' };

const REACT_19 = { kind: 'skill', name: 'react-19' } as const;

const markdown = (regression: Regression) =>
  regressionMarkdown({
    labels,
    minTrialsForRate: 6,
    regression,
    suite: 'skills',
  });

const ruleOnly = (
  rule: Exclude<Regression['rule'], { readonly kind: 'needs-database' }>,
): Regression => ({ flaky: [], rule });

describe('regressionMarkdown', () => {
  it('heads a regression with every subject and gives one line per finding', () => {
    expect(
      markdown(
        ruleOnly({
          findings: [
            {
              kind: 'rate',
              main: {
                k: 12,
                kind: 'rate',
                lower: 0.757,
                n: 12,
                rate: 1,
                upper: 1,
              },
              pr: {
                k: 9,
                kind: 'rate',
                lower: 0.47,
                n: 12,
                rate: 0.75,
                upper: 0.91,
              },
            },
            {
              failed: 3,
              kind: 'flip',
              subject: REACT_19,
              taskKey: 'react-19/trigger',
              trials: 3,
            },
            { kind: 'mean', mean: 3, subject: undefined, threshold: 3.5 },
          ],
          kind: 'regression',
        }),
      ),
    ).toBe(
      [
        '**Regression flagged** in the suite pass rate, skill `react-19`, the suite as a whole:',
        "- the suite pass rate: 75.0% on feat/x, below 75.7%, the lower bound of main's Wilson interval",
        '- skill `react-19`: `react-19/trigger` failed 3 of 3 counted trials on feat/x after passing every trial on main',
        '- the suite as a whole: mean judge score 3.00 on feat/x, below 3.50, the baseline mean less `scored.sigma` standard deviations',
      ].join('\n'),
    );
  });

  it('says no baseline for the model and how to record one', () => {
    expect(
      markdown(ruleOnly({ kind: 'no-baseline', modelId: 'model-b' })),
    ).toBe(
      'Regression rule: no baseline for model-b, so nothing is flagged. Record one with `vp run evals:baseline -- --suite skills` on that model before comparing.',
    );
  });

  it('says why the rule was not applied', () => {
    expect(markdown({ flaky: [], rule: { kind: 'needs-database' } })).toBe(
      REGRESSION_NEEDS_DATABASE,
    );
    expect(
      markdown(ruleOnly({ kind: 'incomparable', reason: 'model-changed' })),
    ).toContain('different models');
    expect(
      markdown(ruleOnly({ kind: 'incomparable', reason: 'harness-changed' })),
    ).toContain('--allow-harness-change');
  });

  it('says when the data was too thin to judge, naming what', () => {
    expect(
      markdown(ruleOnly({ kind: 'insufficient', unjudged: [] })),
    ).toContain('A pass rate needs 6 counted trials on each side.');
    expect(
      markdown(
        ruleOnly({ kind: 'insufficient', unjudged: ['react-19/trigger'] }),
      ),
    ).toContain('Too few counted trials to judge `react-19/trigger`.');
  });

  it('lists flaky tasks after the verdict with their trial split', () => {
    expect(
      markdown({
        flaky: [
          {
            a: { excluded: 0, k: 2, n: 3 },
            b: undefined,
            disagreeing: 3,
            runs: 10,
            taskKey: 'epic/near-miss',
          },
        ],
        rule: { kind: 'clear' },
      }),
    ).toBe(
      [
        'Regression rule: nothing flagged.',
        '',
        'Flaky, left out of the rule:',
        '- `epic/near-miss`: main 2/3, feat/x —; its trials disagreed in 3 of its last 10 runs',
      ].join('\n'),
    );
  });
});
