import { describe, expect, it } from 'vite-plus/test';

import { memoryFileSystem } from '../ingest/memoryFileSystem.util.ts';
import { baselineEnvelopes } from './baselineEnvelopes.service.ts';
import { baselineFixtures } from './baselineFixtures.service.ts';
import { stubBaselineRun } from './stubBaselineRun.service.ts';

const { skills } = await baselineFixtures();

const BASELINE = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

const run = (baselineId: string) =>
  stubBaselineRun({
    baselineId,
    fixture: skills,
    trialsBySkill: { 'react-19': [{ outcome: 'pass' }] },
  });

const fileOf = (runId: string) => `/results/skills/${runId}.json`;

describe('baselineEnvelopes', () => {
  it('names an invalid envelope of its baseline and ignores one of another', async () => {
    const valid = run(BASELINE);
    const ours = { ...run(BASELINE), schema_version: 99 };
    const theirs = { ...run(OTHER), schema_version: 99 };
    const files = Object.fromEntries(
      [valid, ours, theirs].map((envelope) => [
        fileOf(envelope.run.run_id),
        JSON.stringify(envelope),
      ]),
    );
    const loaded = await baselineEnvelopes({
      baselineId: BASELINE,
      fileSystem: memoryFileSystem(files),
      paths: ['/results/skills'],
    });

    expect(loaded.envelopes.map(({ envelope }) => envelope.run.run_id)).toEqual(
      [valid.run.run_id],
    );
    expect(loaded.problems).toHaveLength(1);
    expect(loaded.problems[0]).toContain(
      `${fileOf(ours.run.run_id)} is not a valid envelope, so it is left out: `,
    );
  });
});
