import { describe, expect, it } from 'vite-plus/test';

import { regressionConfigFixture } from './regressionConfigFixture.util.ts';
import { reportRunFixture } from './reportRunFixture.util.ts';
import { reportTaskFixture } from './reportTaskFixture.util.ts';
import { ruleVerdict } from './ruleVerdict.util.ts';

const run = reportRunFixture({
  tasks: [reportTaskFixture({ outcomes: ['pass', 'pass', 'pass'] })],
});

const args = {
  a: run,
  allowHarnessChange: false,
  b: run,
  config: regressionConfigFixture(),
  flaky: [],
};

describe('ruleVerdict', () => {
  it('says there is no baseline before judging anything', () => {
    expect(
      ruleVerdict({ ...args, baseline: { kind: 'rows', rows: [] } }),
    ).toEqual({ kind: 'no-baseline', modelId: 'model-a' });
  });

  it('judges a suite that needs no baseline with the binary rule', () => {
    expect(
      ruleVerdict({ ...args, baseline: { kind: 'not-required' } }),
    ).toEqual({ kind: 'insufficient', unjudged: [] });
  });

  it('judges skill-quality with the scored rule against the baseline', () => {
    const quality = reportRunFixture({
      suite: 'skill-quality',
      tasks: [reportTaskFixture({ scores: [1, 1] })],
    });

    expect(
      ruleVerdict({
        ...args,
        a: quality,
        b: quality,
        baseline: {
          kind: 'rows',
          rows: [
            {
              baselineId: '11111111-1111-4111-8111-111111111111',
              gitSha: 'b'.repeat(40),
              harnessVersion: 'h1',
              mean: 4,
              metric: 'quality_overall',
              modelId: 'model-a',
              nRuns: 5,
              stddev: 0.5,
              subject: undefined,
              suite: 'skill-quality',
            },
          ],
        },
      }),
    ).toMatchObject({
      findings: [{ kind: 'mean', mean: 1 }],
      kind: 'regression',
    });
  });
});
