import { describe, expect, it } from 'vite-plus/test';

import type { Outcome } from '../stats/stats.types.ts';

import { aggregateBaseline } from './aggregateBaseline.util.ts';
import { baselineFixtures } from './baselineFixtures.util.ts';
import { stubBaselineRun } from './stubBaselineRun.util.ts';

const { quality, rules, skills } = await baselineFixtures();

const BASELINE_A = '11111111-1111-4111-8111-111111111111';
const BASELINE_B = '22222222-2222-4222-8222-222222222222';

const trials = (...outcomes: readonly Outcome[]) =>
  outcomes.map((outcome) => ({ outcome }));

const sampleStddev = (values: readonly number[]) => {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      (values.length - 1),
  );
};

type SkillsRunArgs = {
  readonly baselineId: string;
  readonly modelId: string;
  readonly trialsBySkill: Parameters<
    typeof stubBaselineRun
  >[0]['trialsBySkill'];
};

type TwoTrialRunArgs = Omit<SkillsRunArgs, 'trialsBySkill'> & {
  readonly outcome: Outcome;
};

const skillsRun = ({ baselineId, modelId, trialsBySkill }: SkillsRunArgs) =>
  stubBaselineRun({ baselineId, fixture: skills, modelId, trialsBySkill });

const twoTrialRun = ({ baselineId, modelId, outcome }: TwoTrialRunArgs) =>
  skillsRun({
    baselineId,
    modelId,
    trialsBySkill: { 'react-19': trials(outcome, 'pass') },
  });

const qualityRun = (overall: number) =>
  stubBaselineRun({
    baselineId: BASELINE_A,
    fixture: quality,
    trialsBySkill: {
      unslop: [{ outcome: 'pass', overall }, { outcome: 'error' }],
    },
  });

describe('aggregateBaseline', () => {
  it('records the mean and sample standard deviation of each subject and of the suite', () => {
    const { problems, rows } = aggregateBaseline([
      skillsRun({
        baselineId: BASELINE_A,
        modelId: 'model-a',
        trialsBySkill: {
          'react-19': trials('pass', 'pass', 'pass', 'fail'),
          'store-pattern': trials('pass', 'pass'),
        },
      }),
      skillsRun({
        baselineId: BASELINE_A,
        modelId: 'model-a',
        trialsBySkill: {
          'react-19': trials('pass', 'pass', 'fail', 'fail'),
          'store-pattern': trials('pass', 'fail'),
        },
      }),
      skillsRun({
        baselineId: BASELINE_A,
        modelId: 'model-a',
        trialsBySkill: {
          'react-19': trials('pass', 'pass', 'pass', 'pass'),
          'store-pattern': trials('fail', 'fail'),
        },
      }),
    ]);

    expect(problems).toEqual([]);
    expect(
      rows.map(({ mean, nRuns, stddev, subject }) => ({
        mean,
        nRuns,
        stddev,
        subject,
      })),
    ).toEqual([
      {
        mean: expect.closeTo(4 / 6, 12),
        nRuns: 3,
        stddev: expect.closeTo(sampleStddev([5 / 6, 3 / 6, 4 / 6]), 12),
        subject: undefined,
      },
      {
        mean: expect.closeTo(0.75, 12),
        nRuns: 3,
        stddev: expect.closeTo(0.25, 12),
        subject: { kind: 'skill', name: 'react-19' },
      },
      {
        mean: expect.closeTo(0.5, 12),
        nRuns: 3,
        stddev: expect.closeTo(0.5, 12),
        subject: { kind: 'skill', name: 'store-pattern' },
      },
    ]);
    expect(rows[0]).toMatchObject({
      baselineId: BASELINE_A,
      gitSha: 'a'.repeat(40),
      metric: 'pass_rate',
      modelId: 'model-a',
      suite: 'skills',
    });
  });

  it('keys each row on suite, model and subject, so a second model gets rows of its own', () => {
    const { problems, rows } = aggregateBaseline([
      twoTrialRun({
        baselineId: BASELINE_A,
        modelId: 'model-a',
        outcome: 'pass',
      }),
      twoTrialRun({
        baselineId: BASELINE_B,
        modelId: 'model-b',
        outcome: 'fail',
      }),
      twoTrialRun({
        baselineId: BASELINE_A,
        modelId: 'model-a',
        outcome: 'pass',
      }),
      twoTrialRun({
        baselineId: BASELINE_B,
        modelId: 'model-b',
        outcome: 'fail',
      }),
    ]);

    expect(problems).toEqual([]);
    expect(
      rows.map(({ mean, modelId, subject, suite }) => [
        suite,
        modelId,
        subject?.name ?? 'suite',
        mean,
      ]),
    ).toEqual([
      ['skills', 'model-a', 'suite', 1],
      ['skills', 'model-a', 'react-19', 1],
      ['skills', 'model-b', 'suite', 0.5],
      ['skills', 'model-b', 'react-19', 0.5],
    ]);
    expect(new Set(rows.map(({ baselineId }) => baselineId))).toEqual(
      new Set([BASELINE_A, BASELINE_B]),
    );
  });

  it('records nothing for a baseline whose runs span two models or two commits', () => {
    const { problems, rows } = aggregateBaseline([
      skillsRun({
        baselineId: BASELINE_A,
        modelId: 'model-a',
        trialsBySkill: { 'react-19': trials('pass') },
      }),
      skillsRun({
        baselineId: BASELINE_A,
        modelId: 'model-b',
        trialsBySkill: { 'react-19': trials('pass') },
      }),
      stubBaselineRun({
        baselineId: BASELINE_B,
        fixture: skills,
        gitSha: 'b'.repeat(40),
        trialsBySkill: { 'react-19': trials('pass') },
      }),
      stubBaselineRun({
        baselineId: BASELINE_B,
        fixture: skills,
        gitSha: 'c'.repeat(40),
        trialsBySkill: { 'react-19': trials('pass') },
      }),
    ]);

    expect(rows).toEqual([]);
    expect(problems).toEqual([
      `baseline ${BASELINE_A} spans models model-a, model-b, so it records nothing`,
      `baseline ${BASELINE_B} spans commits ${'b'.repeat(40)}, ${'c'.repeat(40)}, so it records nothing`,
    ]);
  });

  it('leaves out runs that are partial, dirty, untagged or call no model, and says why', () => {
    const excluded = [
      stubBaselineRun({
        baselineId: BASELINE_A,
        fixture: skills,
        status: 'partial',
        trialsBySkill: { 'react-19': trials('pass') },
      }),
      stubBaselineRun({
        baselineId: BASELINE_A,
        fixture: skills,
        gitDirty: true,
        trialsBySkill: { 'react-19': trials('pass') },
      }),
      stubBaselineRun({
        fixture: skills,
        trialsBySkill: { 'react-19': trials('pass') },
      }),
      stubBaselineRun({
        baselineId: BASELINE_A,
        fixture: rules,
        trialsBySkill: { 'react-19': trials('pass') },
      }),
    ];
    const { problems, rows } = aggregateBaseline(excluded);

    expect(rows).toEqual([]);
    expect(problems).toEqual([
      `run ${excluded[0]?.run.run_id ?? ''} is partial, so it is left out`,
      `run ${excluded[1]?.run.run_id ?? ''} ran on a dirty tree, so it is left out`,
      `run ${excluded[2]?.run.run_id ?? ''} belongs to no baseline`,
      `run ${excluded[3]?.run.run_id ?? ''} is a rules-consistency run, which calls no model and has no baseline`,
    ]);
  });

  it('keeps error, timeout and skipped trials out of a rate, and refuses a subject with fewer than two counted runs', () => {
    const { problems, rows } = aggregateBaseline([
      skillsRun({
        baselineId: BASELINE_A,
        modelId: 'model-a',
        trialsBySkill: {
          'react-19': trials('pass', 'error', 'timeout'),
          unslop: trials('error', 'skipped'),
        },
      }),
      skillsRun({
        baselineId: BASELINE_A,
        modelId: 'model-a',
        trialsBySkill: {
          'react-19': trials('fail', 'pass', 'skipped'),
          unslop: trials('pass'),
        },
      }),
    ]);

    expect(
      rows.map(({ mean, subject }) => [subject?.name ?? 'suite', mean]),
    ).toEqual([
      ['suite', (1 + 2 / 3) / 2],
      ['react-19', 0.75],
    ]);
    expect(problems).toEqual([
      'skill unslop has a counted result in 1 of 2 runs; a baseline needs 2',
    ]);
  });

  it('averages the judge overall score for the quality suite and ignores errored trials', () => {
    const { problems, rows } = aggregateBaseline([
      qualityRun(3),
      qualityRun(4),
      qualityRun(5),
    ]);

    expect(problems).toEqual([]);
    expect(rows).toEqual([
      expect.objectContaining({
        mean: 4,
        metric: 'quality_overall',
        stddev: 1,
        subject: undefined,
        suite: 'skill-quality',
      }),
      expect.objectContaining({
        mean: 4,
        metric: 'quality_overall',
        stddev: 1,
        subject: { kind: 'skill', name: 'unslop' },
      }),
    ]);
  });

  it('refuses a single run', () => {
    const { problems, rows } = aggregateBaseline([
      skillsRun({
        baselineId: BASELINE_A,
        modelId: 'model-a',
        trialsBySkill: { 'react-19': trials('pass') },
      }),
    ]);

    expect(rows).toEqual([]);
    expect(problems).toEqual([
      'the suite as a whole has a counted result in 1 of 1 runs; a baseline needs 2',
      'skill react-19 has a counted result in 1 of 1 runs; a baseline needs 2',
    ]);
  });
});
