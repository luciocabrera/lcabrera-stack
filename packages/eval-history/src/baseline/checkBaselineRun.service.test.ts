import { describe, expect, it } from 'vite-plus/test';

import { envelopeFileSystem } from '../ingest/envelopeFileSystem.util.ts';
import { baselineFixtures } from './baselineFixtures.service.ts';
import { checkBaselineRun } from './checkBaselineRun.service.ts';
import { stubBaselineRun } from './stubBaselineRun.service.ts';

const { skills } = await baselineFixtures();

const BASELINE = '11111111-1111-4111-8111-111111111111';

const run = (outcome: 'error' | 'pass') =>
  stubBaselineRun({
    baselineId: BASELINE,
    fixture: skills,
    trialsBySkill: { 'react-19': [{ outcome }] },
  });

type CheckArgs = {
  readonly envelopes: readonly ReturnType<typeof run>[];
  readonly runs: number;
};

const check = ({ envelopes, runs }: CheckArgs) =>
  checkBaselineRun({
    baselineId: BASELINE,
    fileSystem: envelopeFileSystem(envelopes),
    paths: ['/results/skills'],
    runs,
  });

describe('checkBaselineRun', () => {
  it('finds nothing wrong when every run left a usable envelope', async () => {
    expect(
      await check({ envelopes: [run('pass'), run('pass')], runs: 2 }),
    ).toEqual([]);
  });

  it('names a run that left no envelope', async () => {
    expect(await check({ envelopes: [run('pass')], runs: 2 })).toEqual([
      `1 of 2 runs left no envelope for baseline ${BASELINE} under /results/skills, so a runner failed before recording`,
    ]);
  });

  it('names a run whose every trial ended in error', async () => {
    const failed = run('error');

    expect(await check({ envelopes: [failed], runs: 1 })).toEqual([
      `every trial of run ${failed.run.run_id} ended in error, which points at the harness rather than the model`,
    ]);
  });
});
