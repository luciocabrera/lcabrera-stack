import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { EnvelopeShape } from './envelope.types.ts';

import { envelopeShapeSchema } from './envelope.schema.ts';
import { envelopeConsistencyIssues } from './envelopeConsistencyIssues.util.ts';
import { readJsonFiles } from './readJsonFiles.service.ts';

const fixturesDirectory = fileURLToPath(new URL('fixtures', import.meta.url));

const skillsFixture = async (): Promise<EnvelopeShape> => {
  const fixtures = await readJsonFiles({ directory: fixturesDirectory });

  return envelopeShapeSchema.parse(fixtures.get('skills.json'));
};

describe('envelopeConsistencyIssues', () => {
  it('finds nothing in a consistent envelope', async () => {
    expect(envelopeConsistencyIssues(await skillsFixture())).toEqual([]);
  });

  it('names every trial that breaks a cross-field rule', async () => {
    const envelope = await skillsFixture();
    const [first] = envelope.trials;

    if (!first) {
      throw new Error('the skills fixture has no trial');
    }

    const broken = {
      ...envelope,
      run: { ...envelope.run, suite: 'skill-quality' as const },
      trials: [{ ...first, outcome: 'error' as const, task_key: 'missing' }],
    };

    expect(
      envelopeConsistencyIssues(broken).map(({ path }) => path.join('.')),
    ).toEqual([
      'trials.0.detail.schema',
      'trials.0.task_key',
      'trials.0.error_class',
    ]);
  });
});
