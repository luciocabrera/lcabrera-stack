import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { fixtureEnvelope } from './fixtureEnvelope.util.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const base: RunEnvelope = runEnvelopeSchema.parse(fixtures.get('skills.json'));

describe('fixtureEnvelope', () => {
  it('builds one task per key and one trial per outcome, in order', () => {
    const envelope = fixtureEnvelope({
      base,
      branch: 'feat/x',
      outcomes: {
        'skills/a/trigger-1': ['pass', 'error'],
        'skills/a/trigger-2': [],
      },
      runId: '00000000-0000-4000-8000-000000000009',
    });

    expect(envelope.run).toMatchObject({
      branch: 'feat/x',
      run_id: '00000000-0000-4000-8000-000000000009',
    });
    expect(envelope.tasks.map(({ task_key }) => task_key)).toEqual([
      'skills/a/trigger-1',
      'skills/a/trigger-2',
    ]);
    expect(
      envelope.trials.map(({ error_class, outcome, trial_index }) => [
        outcome,
        trial_index,
        error_class,
      ]),
    ).toEqual([
      ['pass', 0, base.trials[0]?.error_class],
      ['error', 1, 'error_max_turns'],
    ]);
  });
});
