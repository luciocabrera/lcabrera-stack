import { describe, expect, it } from 'vite-plus/test';

import type { Outcome } from '../stats/stats.types.ts';

import { binaryVerdict } from './binaryVerdict.util.ts';
import { regressionConfigFixture } from './regressionConfigFixture.util.ts';
import {
  reportRunFixture,
  reportTaskFixture,
} from './reportRunFixture.util.ts';

const PASSES: readonly Outcome[] = ['pass', 'pass', 'pass'];

const runOf = (outcomesOf: (skill: string) => readonly Outcome[]) =>
  reportRunFixture({
    tasks: ['react-19', 'store-pattern'].flatMap((skill) =>
      [1, 2, 3].map((index) =>
        reportTaskFixture({
          outcomes: outcomesOf(skill),
          subject: { kind: 'skill', name: skill },
          taskKey: `${skill}/trigger-${String(index)}`,
        }),
      ),
    ),
  });

const main = runOf(() => PASSES);

const args = {
  a: main,
  allowHarnessChange: false,
  config: regressionConfigFixture(),
  flaky: [],
};

describe('binaryVerdict', () => {
  it('names the subject of every task that flipped', () => {
    const verdict = binaryVerdict({
      ...args,
      b: runOf((skill) =>
        skill === 'react-19' ? ['pass', 'fail', 'fail'] : PASSES,
      ),
    });

    expect(verdict).toMatchObject({ kind: 'regression' });
    expect(
      verdict.kind === 'regression' &&
        verdict.findings
          .filter((finding) => finding.kind === 'flip')
          .map(({ subject }) => subject?.name),
    ).toEqual(['react-19', 'react-19', 'react-19']);
  });

  it('clears an unchanged run', () => {
    expect(binaryVerdict({ ...args, b: runOf(() => PASSES) })).toEqual({
      kind: 'clear',
    });
  });

  it('leaves a flaky task out', () => {
    expect(
      binaryVerdict({
        ...args,
        b: {
          ...main,
          tasks: main.tasks.map((task) =>
            task.taskKey === 'react-19/trigger-1'
              ? { ...task, outcomes: ['fail', 'fail', 'pass'] }
              : task,
          ),
        },
        flaky: ['react-19/trigger-1'],
      }),
    ).toEqual({ kind: 'clear' });
  });

  it('refuses two harness versions unless allowed', () => {
    const b = { ...main, harnessVersion: 'h2' };

    expect(binaryVerdict({ ...args, b })).toEqual({
      kind: 'incomparable',
      reason: 'harness-changed',
    });
    expect(binaryVerdict({ ...args, allowHarnessChange: true, b })).toEqual({
      kind: 'clear',
    });
  });
});
