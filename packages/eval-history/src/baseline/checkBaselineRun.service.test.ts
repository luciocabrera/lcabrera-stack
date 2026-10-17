import { describe, expect, it } from 'vite-plus/test';

import { envelopeFileSystem } from '../ingest/envelopeFileSystem.util.ts';
import { memoryFileSystem } from '../ingest/memoryFileSystem.util.ts';
import { baselineFixtures } from './baselineFixtures.service.ts';
import { checkBaselineRun } from './checkBaselineRun.service.ts';
import { stubBaselineRun } from './stubBaselineRun.service.ts';

const { skills } = await baselineFixtures();

const BASELINE = '11111111-1111-4111-8111-111111111111';

const STALE = '/results/skills/33333333-3333-4333-8333-333333333333.json';

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

  it('checks only the runs this invocation added to a continued baseline', async () => {
    const earlier = run('error');
    const added = run('pass');

    expect(
      await checkBaselineRun({
        baselineId: BASELINE,
        exclude: [`/results/skills/${earlier.run.run_id}.json`],
        fileSystem: envelopeFileSystem([earlier, added]),
        paths: ['/results/skills'],
        runs: 1,
      }),
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

  it('stops on an envelope that carries this baseline but fails to parse', async () => {
    const broken = { ...run('pass'), schema_version: 99 };
    const file = `/results/skills/${broken.run.run_id}.json`;
    const problems = await checkBaselineRun({
      baselineId: BASELINE,
      fileSystem: memoryFileSystem({ [file]: JSON.stringify(broken) }),
      paths: ['/results/skills'],
      runs: 1,
    });

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(
      `${file} carries baseline ${BASELINE} but is not a valid envelope, so it is left out: `,
    );
  });

  it('does not stop on a file it cannot read, which names no baseline', async () => {
    const good = run('pass');
    const files = memoryFileSystem({
      [`/results/skills/${good.run.run_id}.json`]: JSON.stringify(good),
      [STALE]: '',
    });
    const problems = await checkBaselineRun({
      baselineId: BASELINE,
      fileSystem: {
        ...files,
        readFile: (file: string) =>
          file === STALE
            ? Promise.reject(new Error('permission denied'))
            : files.readFile(file),
      },
      paths: ['/results/skills'],
      runs: 1,
    });

    expect(problems).toEqual([]);
  });
});
