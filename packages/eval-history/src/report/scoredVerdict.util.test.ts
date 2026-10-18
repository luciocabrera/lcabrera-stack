import { describe, expect, it } from 'vite-plus/test';

import { regressionConfigFixture } from './regressionConfigFixture.util.ts';
import { reportRunFixture } from './reportRunFixture.util.ts';
import { reportTaskFixture } from './reportTaskFixture.util.ts';
import { scoredBaselineRowFixture } from './scoredBaselineRowFixture.util.ts';
import { scoredVerdict } from './scoredVerdict.util.ts';

const SKILLS = ['react-19', 'unslop'] as const;

const runScoring = (scoresOf: (skill: string) => readonly number[]) =>
  reportRunFixture({
    suite: 'skill-quality',
    tasks: SKILLS.map((skill) =>
      reportTaskFixture({
        outcomes: ['pass', 'pass', 'pass'],
        scores: scoresOf(skill),
        subject: { kind: 'skill', name: skill },
        taskKey: `skill-quality/${skill}`,
      }),
    ),
  });

const baseline = [
  scoredBaselineRowFixture(undefined),
  ...SKILLS.map((skill) => scoredBaselineRowFixture(skill)),
];

const args = {
  allowHarnessChange: false,
  baseline,
  config: regressionConfigFixture(),
  flaky: [],
};

describe('scoredVerdict', () => {
  it('flags a subject whose mean fell more than sigma deviations, naming it', () => {
    expect(
      scoredVerdict({
        ...args,
        b: runScoring((skill) => (skill === 'unslop' ? [3, 3, 3] : [4, 4, 4])),
      }),
    ).toEqual({
      findings: [
        {
          kind: 'mean',
          mean: 3,
          subject: { kind: 'skill', name: 'unslop' },
          threshold: 3.5,
        },
      ],
      kind: 'regression',
    });
  });

  it('flags the suite too when every subject fell', () => {
    const verdict = scoredVerdict({ ...args, b: runScoring(() => [3, 3, 3]) });

    expect(
      verdict.kind === 'regression' &&
        verdict.findings.map((finding) =>
          finding.kind === 'rate' ? 'rate' : finding.subject?.name,
        ),
    ).toEqual([undefined, 'react-19', 'unslop']);
  });

  it('clears a run within the noise floor', () => {
    expect(
      scoredVerdict({ ...args, b: runScoring(() => [3.75, 4, 4.25]) }),
    ).toEqual({ kind: 'clear' });
  });

  it('judges only the subjects the run holds, and not the suite then', () => {
    const run = runScoring(() => [3, 3, 3]);

    expect(
      scoredVerdict({
        ...args,
        b: { ...run, tasks: run.tasks.slice(0, 1) },
      }),
    ).toMatchObject({
      findings: [{ subject: { kind: 'skill', name: 'react-19' } }],
      kind: 'regression',
    });
  });

  it('leaves out a flaky task and a capability task', () => {
    const run = runScoring(() => [1, 1, 1]);

    expect(
      scoredVerdict({
        ...args,
        b: {
          ...run,
          tasks: run.tasks.map((task) =>
            task.subject.name === 'unslop'
              ? { ...task, set: 'capability' as const }
              : task,
          ),
        },
        flaky: ['skill-quality/react-19'],
      }),
    ).toEqual({
      kind: 'insufficient',
      unjudged: ['skill-quality', 'skill:react-19', 'skill:unslop'],
    });
  });

  it('refuses a run on another harness than the baseline unless allowed', () => {
    const b = { ...runScoring(() => [4, 4, 4]), harnessVersion: 'h2' };

    expect(scoredVerdict({ ...args, b })).toEqual({
      kind: 'incomparable',
      reason: 'harness-changed',
    });
    expect(scoredVerdict({ ...args, allowHarnessChange: true, b })).toEqual({
      kind: 'clear',
    });
  });

  it('judges nothing, and says so, when no subject of the run has a baseline row', () => {
    const run = runScoring(() => [1, 1, 1]);

    expect(
      scoredVerdict({
        ...args,
        b: {
          ...run,
          tasks: run.tasks.map((task) => ({
            ...task,
            subject: { kind: 'skill', name: `renamed-${task.subject.name}` },
          })),
        },
      }),
    ).toEqual({
      kind: 'insufficient',
      unjudged: ['skill:renamed-react-19', 'skill:renamed-unslop'],
    });
  });

  it('compares the suite only over the subjects its baseline covers', () => {
    const run = runScoring(() => [4, 4, 4]);

    expect(
      scoredVerdict({
        ...args,
        b: {
          ...run,
          tasks: [
            ...run.tasks,
            reportTaskFixture({
              outcomes: ['pass', 'pass', 'pass'],
              scores: [1, 1, 1],
              subject: { kind: 'skill', name: 'epic' },
              taskKey: 'skill-quality/epic',
            }),
          ],
        },
      }),
    ).toEqual({ kind: 'clear' });
  });
});
