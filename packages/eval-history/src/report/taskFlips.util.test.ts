import { describe, expect, it } from 'vite-plus/test';

import type { Outcome } from '../stats/stats.types.ts';
import type { ReportRun } from './report.types.ts';

import { taskFlips } from './taskFlips.util.ts';

const runOf = (
  outcomes: Readonly<Record<string, readonly Outcome[]>>,
): ReportRun => ({
  branch: 'main',
  durationsMs: [],
  gitSha: 'a'.repeat(40),
  harnessVersion: 'h1',
  modelId: 'model-a',
  runId: 'run',
  status: 'complete',
  subjects: [],
  suite: 'skills',
  tasks: Object.entries(outcomes).map(([taskKey, taskOutcomes]) => ({
    outcomes: taskOutcomes,
    taskHash: taskKey,
    taskKey,
  })),
});

describe('taskFlips', () => {
  it('lists a task that stopped passing every trial, and one that started', () => {
    expect(
      taskFlips({
        a: runOf({ down: ['pass', 'pass'], up: ['pass', 'fail'] }),
        b: runOf({ down: ['pass', 'fail'], up: ['pass', 'pass'] }),
      }),
    ).toEqual([
      {
        a: { excluded: 0, k: 2, n: 2 },
        b: { excluded: 0, k: 1, n: 2 },
        taskKey: 'down',
      },
      {
        a: { excluded: 0, k: 1, n: 2 },
        b: { excluded: 0, k: 2, n: 2 },
        taskKey: 'up',
      },
    ]);
  });

  it('leaves out a task whose pass@k and pass^k both held', () => {
    expect(
      taskFlips({
        a: runOf({ same: ['pass', 'fail', 'fail'] }),
        b: runOf({ same: ['fail', 'pass', 'pass'] }),
      }),
    ).toEqual([]);
  });

  it('does not count an excluded trial as a failure', () => {
    expect(
      taskFlips({
        a: runOf({ task: ['pass', 'pass'] }),
        b: runOf({ task: ['pass', 'error'] }),
      }),
    ).toEqual([]);
  });

  it('lists a task only one run has, with the other side absent', () => {
    expect(taskFlips({ a: runOf({}), b: runOf({ added: ['pass'] }) })).toEqual([
      { b: { excluded: 0, k: 1, n: 1 }, taskKey: 'added' },
    ]);
  });
});
