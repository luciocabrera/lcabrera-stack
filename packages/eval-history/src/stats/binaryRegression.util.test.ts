import { describe, expect, it } from 'vite-plus/test';

import type { Outcome, RegressionConfig, TaskTrials } from './stats.types.ts';

import { binaryRegression } from './binaryRegression.util.ts';

type CompareArgs = Partial<Parameters<typeof binaryRegression>[0]> & {
  readonly prTasks: readonly TaskTrials[];
};

type TasksArgs = {
  readonly outcomesAt: (index: number) => readonly Outcome[];
  readonly setAt?: (index: number) => TaskTrials['set'];
};

const config: RegressionConfig = {
  baseline: { defaultRuns: 5 },
  binary: { flip: { failAtLeast: 2, ofTrials: 3 } },
  flaky: { disagreeFraction: 0.2, window: 10 },
  minTrialsForRate: 6,
  scored: { sigma: 2 },
  z: 1.96,
};
const identity = { harnessVersion: 'aaaaaaaaaaaa', modelId: 'model-a' };
const PASSES: readonly Outcome[] = ['pass', 'pass', 'pass'];
const ONE_FAIL: readonly Outcome[] = ['pass', 'fail', 'pass'];
const TWO_FAILS: readonly Outcome[] = ['fail', 'pass', 'fail'];

const tasks = ({ outcomesAt, setAt = () => 'regression' }: TasksArgs) =>
  Array.from({ length: 10 }, (_, index): TaskTrials => ({
    outcomes: outcomesAt(index),
    set: setAt(index),
    taskKey: `task-${index}`,
  }));

const firstIsCapability = (index: number) =>
  index === 0 ? 'capability' : 'regression';

const main = { identity, tasks: tasks({ outcomesAt: () => PASSES }) };

const compare = ({ prTasks, ...overrides }: CompareArgs) =>
  binaryRegression({
    config,
    flaky: [],
    main,
    pr: { identity, tasks: prTasks },
    ...overrides,
  });

describe('binaryRegression — the interval rule', () => {
  it('flags a PR pass rate below the lower bound of main’s interval', () => {
    const result = compare({
      prTasks: tasks({
        outcomesAt: (index) => (index < 6 ? ONE_FAIL : PASSES),
      }),
    });

    expect(result.kind).toBe('regression');
    expect(result.kind === 'regression' && result.findings).toEqual([
      expect.objectContaining({
        kind: 'rate',
        pr: expect.objectContaining({ k: 24, n: 30 }),
      }),
    ]);
  });

  it('does not flag a PR pass rate inside main’s interval', () => {
    expect(
      compare({
        prTasks: tasks({
          outcomesAt: (index) => (index < 2 ? ONE_FAIL : PASSES),
        }),
      }),
    ).toEqual({ kind: 'clear' });
  });

  it('reports insufficient when either side has too few trials for a rate', () => {
    const single: readonly TaskTrials[] = [
      { outcomes: PASSES, set: 'regression', taskKey: 'task-0' },
    ];

    expect(
      compare({ main: { identity, tasks: single }, prTasks: single }),
    ).toEqual({ kind: 'insufficient', unjudged: [] });
  });
});

describe('binaryRegression — the flip rule', () => {
  const flipAtZero = tasks({
    outcomesAt: (index) => (index === 0 ? TWO_FAILS : PASSES),
  });

  it('flags a regression-set task that is not flaky and failed 2 of 3', () => {
    expect(compare({ prTasks: flipAtZero })).toEqual({
      findings: [{ failed: 2, kind: 'flip', taskKey: 'task-0', trials: 3 }],
      kind: 'regression',
    });
  });

  it('reports insufficient, naming the task, when an excluded trial leaves a flip unjudged', () => {
    expect(
      compare({
        prTasks: tasks({
          outcomesAt: (index) =>
            index === 0 ? ['fail', 'error', 'fail'] : PASSES,
        }),
      }),
    ).toEqual({ kind: 'insufficient', unjudged: ['task-0'] });
  });

  it('stays clear when an excluded trial could not have changed the verdict', () => {
    expect(
      compare({
        prTasks: tasks({
          outcomesAt: (index) =>
            index === 0 ? ['pass', 'error', 'pass'] : PASSES,
        }),
      }),
    ).toEqual({ kind: 'clear' });
  });

  it('does not flag the same flip on a capability task', () => {
    expect(
      compare({
        main: {
          identity,
          tasks: tasks({ outcomesAt: () => PASSES, setAt: firstIsCapability }),
        },
        prTasks: tasks({
          outcomesAt: (index) => (index === 0 ? TWO_FAILS : PASSES),
          setAt: firstIsCapability,
        }),
      }),
    ).toEqual({ kind: 'clear' });
  });

  it('does not flag the same flip on a flaky task', () => {
    expect(compare({ flaky: ['task-0'], prTasks: flipAtZero })).toEqual({
      kind: 'clear',
    });
  });
});

describe('binaryRegression — fair comparison', () => {
  const failing = tasks({ outcomesAt: () => TWO_FAILS });

  it('refuses a comparison across models', () => {
    expect(
      compare({
        main: { ...main, identity: { ...identity, modelId: 'model-b' } },
        prTasks: failing,
      }),
    ).toEqual({ kind: 'incomparable', reason: 'model-changed' });
  });

  it('refuses a harness change unless it is allowed', () => {
    const changed = {
      identity: { ...identity, harnessVersion: 'bbbbbbbbbbbb' },
      tasks: failing,
    };

    expect(compare({ pr: changed, prTasks: failing })).toEqual({
      kind: 'incomparable',
      reason: 'harness-changed',
    });
    expect(
      compare({ allowHarnessChange: true, pr: changed, prTasks: failing }).kind,
    ).toBe('regression');
  });
});
