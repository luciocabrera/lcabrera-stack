import { describe, expect, it } from 'vite-plus/test';

import { regressionConfigFixture } from './regressionConfigFixture.util.ts';
import { regressionVerdict } from './regressionVerdict.util.ts';
import {
  reportRunFixture,
  reportTaskFixture,
} from './reportRunFixture.util.ts';

const TASK_KEYS = [
  'react-19/trigger',
  'react-19/near-miss',
  'react-19/trigger-2',
  'react-19/near-miss-2',
];

const runOf = (failing: readonly string[]) =>
  reportRunFixture({
    tasks: TASK_KEYS.map((taskKey) =>
      reportTaskFixture({
        outcomes: failing.includes(taskKey)
          ? ['fail', 'fail', 'fail']
          : ['pass', 'pass', 'pass'],
        taskKey,
      }),
    ),
  });

const BASELINE_ROW = {
  baselineId: '11111111-1111-4111-8111-111111111111',
  gitSha: 'b'.repeat(40),
  harnessVersion: 'h1',
  mean: 1,
  metric: 'pass_rate' as const,
  modelId: 'model-a',
  nRuns: 5,
  stddev: 0,
  subject: undefined,
  suite: 'skills' as const,
};

const flakyRow = (taskKey: string) => ({
  disagreeFraction: 0.3,
  disagreeing: 3,
  runs: 10,
  suite: 'skills' as const,
  taskKey,
});

const args = {
  a: runOf([]),
  allowHarnessChange: false,
  b: runOf(['react-19/trigger']),
  config: regressionConfigFixture(),
};

describe('regressionVerdict', () => {
  it('applies nothing without the database', () => {
    expect(
      regressionVerdict({ ...args, history: { kind: 'needs-database' } }),
    ).toEqual({ flaky: [], rule: { kind: 'needs-database' } });
  });

  it('says there is no baseline for the model under test', () => {
    expect(
      regressionVerdict({
        ...args,
        history: {
          baseline: { kind: 'rows', rows: [] },
          flaky: [],
          kind: 'read',
        },
      }).rule,
    ).toEqual({ kind: 'no-baseline', modelId: 'model-a' });
  });

  it('flags a task that failed after passing, given a baseline', () => {
    expect(
      regressionVerdict({
        ...args,
        history: {
          baseline: { kind: 'rows', rows: [BASELINE_ROW] },
          flaky: [],
          kind: 'read',
        },
      }).rule,
    ).toMatchObject({
      findings: expect.arrayContaining([
        expect.objectContaining({
          kind: 'flip',
          subject: { kind: 'skill', name: 'react-19' },
          taskKey: 'react-19/trigger',
        }),
      ]),
      kind: 'regression',
    });
  });

  it('lists a flaky task and leaves it out of the rule', () => {
    const verdict = regressionVerdict({
      ...args,
      history: {
        baseline: { kind: 'rows', rows: [BASELINE_ROW] },
        flaky: [flakyRow('react-19/trigger')],
        kind: 'read',
      },
    });

    expect(verdict.flaky.map(({ taskKey }) => taskKey)).toEqual([
      'react-19/trigger',
    ]);
    expect(verdict.rule).toEqual({ kind: 'clear' });
  });

  it('needs no baseline for a suite that runs no model', () => {
    expect(
      regressionVerdict({
        ...args,
        a: { ...args.a, modelId: undefined, suite: 'rules-consistency' },
        b: { ...args.b, modelId: undefined, suite: 'rules-consistency' },
        history: {
          baseline: { kind: 'not-required' },
          flaky: [],
          kind: 'read',
        },
      }).rule,
    ).toMatchObject({ kind: 'regression' });
  });

  it('applies the scored rule to skill-quality', () => {
    const b = reportRunFixture({
      suite: 'skill-quality',
      tasks: [reportTaskFixture({ scores: [1, 1] })],
    });

    expect(
      regressionVerdict({
        ...args,
        a: b,
        b,
        history: {
          baseline: {
            kind: 'rows',
            rows: [
              {
                ...BASELINE_ROW,
                mean: 4,
                metric: 'quality_overall',
                stddev: 0.5,
                suite: 'skill-quality',
              },
            ],
          },
          flaky: [],
          kind: 'read',
        },
      }).rule,
    ).toMatchObject({
      findings: [{ kind: 'mean', mean: 1, threshold: 3 }],
      kind: 'regression',
    });
  });
});
