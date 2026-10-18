import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import {
  hiddenSkillOutcomes,
  skillsRunFixture,
} from './skillsRunFixture.util.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const base = runEnvelopeSchema.parse(fixtures.get('skills.json'));

describe('skillsRunFixture', () => {
  it('runs a regression trigger, a regression near-miss and a capability trigger per skill, three trials each', () => {
    const run = skillsRunFixture({
      base,
      runId: '00000000-0000-4000-8000-000000000001',
    });

    expect(run.tasks.map(({ set, task_key }) => [task_key, set])).toEqual([
      ['react-19/trigger', 'regression'],
      ['react-19/near-miss', 'regression'],
      ['react-19/trigger-2', 'capability'],
      ['store-pattern/trigger', 'regression'],
      ['store-pattern/near-miss', 'regression'],
      ['store-pattern/trigger-2', 'capability'],
    ]);
    expect(run.trials.every(({ outcome }) => outcome === 'pass')).toBe(true);
    expect(run.trials).toHaveLength(18);
  });

  it("fails a hidden skill's trigger tasks and nothing else, and records it hidden", () => {
    const run = skillsRunFixture({
      base,
      hidden: ['react-19'],
      outcomesOf: hiddenSkillOutcomes('react-19'),
      runId: '00000000-0000-4000-8000-000000000002',
    });

    expect([
      ...new Set(
        run.trials
          .filter(({ outcome }) => outcome === 'fail')
          .map(({ task_key }) => task_key),
      ),
    ]).toEqual(['react-19/trigger', 'react-19/trigger-2']);
    expect(run.run.settings).toMatchObject({ hidden: ['react-19'] });
  });
});
