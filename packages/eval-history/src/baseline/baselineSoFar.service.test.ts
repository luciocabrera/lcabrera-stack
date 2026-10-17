import { describe, expect, it } from 'vite-plus/test';

import { memoryFileSystem } from '../ingest/memoryFileSystem.util.ts';
import { baselineFixtures } from './baselineFixtures.service.ts';
import { baselineSoFar } from './baselineSoFar.service.ts';
import { stubBaselineRun } from './stubBaselineRun.service.ts';

const { skills } = await baselineFixtures();

const BASELINE = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const BROKEN = '33333333-3333-4333-8333-333333333333';

type RunArgs = {
  readonly baselineId: string;
  readonly gitSha: string;
  readonly modelId: string;
};

const run = ({ baselineId, gitSha, modelId }: RunArgs) =>
  stubBaselineRun({
    baselineId,
    fixture: skills,
    gitSha,
    modelId,
    trialsBySkill: { 'react-19': [{ outcome: 'pass' }] },
  });

const fileOf = (runId: string) => `/results/skills/${runId}.json`;

describe('baselineSoFar', () => {
  it('names the files, commits and models of the runs carrying the id', async () => {
    const first = run({
      baselineId: BASELINE,
      gitSha: 'a'.repeat(40),
      modelId: 'model-a',
    });
    const second = run({
      baselineId: BASELINE,
      gitSha: 'b'.repeat(40),
      modelId: 'model-a',
    });
    const other = run({
      baselineId: OTHER,
      gitSha: 'c'.repeat(40),
      modelId: 'model-c',
    });
    const broken = { ...first, run: { ...first.run, run_id: BROKEN } };
    const files = {
      ...Object.fromEntries(
        [first, second, other].map((envelope) => [
          fileOf(envelope.run.run_id),
          JSON.stringify(envelope),
        ]),
      ),
      [fileOf(BROKEN)]: JSON.stringify({ ...broken, schema_version: 99 }),
    };
    const sofar = await baselineSoFar({
      baselineId: BASELINE,
      fileSystem: memoryFileSystem(files),
      paths: ['/results/skills'],
    });

    expect(new Set(sofar.files)).toEqual(
      new Set([
        fileOf(BROKEN),
        fileOf(first.run.run_id),
        fileOf(second.run.run_id),
      ]),
    );
    expect(new Set(sofar.gitShas)).toEqual(
      new Set(['a'.repeat(40), 'b'.repeat(40)]),
    );
    expect(sofar.modelIds).toEqual(['model-a']);
  });
});
