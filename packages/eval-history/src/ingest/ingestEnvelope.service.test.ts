import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { IngestClient, IngestQuery } from './ingest.types.ts';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { ingestEnvelope } from './ingestEnvelope.service.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const envelope: RunEnvelope = runEnvelopeSchema.parse(
  fixtures.get('skills.json'),
);

const SHA = 'a'.repeat(64);

type FakeArgs = {
  readonly failOn?: string;
  readonly storedSha?: string;
};

type RowsForArgs = {
  readonly storedSha?: string;
  readonly text: string;
};

const rowsFor = ({ storedSha, text }: RowsForArgs) => {
  const responses = [
    [
      'insert into evals.eval_run',
      storedSha ? [] : [{ run_id: envelope.run.run_id }],
    ],
    ['select envelope_sha256', [{ envelope_sha256: storedSha }]],
    ['evals.eval_subject_version', [{ id: '7', subject_id: '3' }]],
    ['evals.eval_task_version', [{ id: '11' }]],
  ] as const;

  return responses.find(([marker]) => text.includes(marker))?.[1] ?? [];
};

const fakeClient = ({ failOn, storedSha }: FakeArgs = {}) => {
  const queries: IngestQuery[] = [];
  const client: IngestClient = {
    query: async (config) => {
      queries.push(config);

      if (failOn && config.text.includes(failOn)) {
        throw new Error(`failed on ${failOn}`);
      }

      return { rows: rowsFor({ storedSha, text: config.text }) };
    },
  };

  return { client, queries };
};

const statements = (queries: readonly IngestQuery[]) =>
  queries.map(({ text }) => {
    const [table] = /evals\.\w+/u.exec(text) ?? [text.trim()];

    return table;
  });

describe('ingestEnvelope', () => {
  it('writes the run, its subject, task and trials in one transaction', async () => {
    const { client, queries } = fakeClient();

    expect(await ingestEnvelope({ client, envelope, sha256: SHA })).toEqual({
      result: 'inserted',
      rows: { subjects: 1, tasks: 1, trials: 3 },
    });
    expect(statements(queries)).toEqual([
      'begin',
      'evals.eval_run',
      'evals.eval_subject',
      'evals.eval_task',
      'evals.eval_trial',
      'evals.eval_trial',
      'evals.eval_trial',
      'commit',
    ]);
  });

  it('stores each trial against its task and subject version, with its measurements', async () => {
    const { client, queries } = fakeClient();
    const [trial] = envelope.trials;

    await ingestEnvelope({ client, envelope, sha256: SHA });

    const values = queries[4]?.values ?? [];

    expect(values.slice(0, 5)).toEqual([
      envelope.run.run_id,
      11,
      7,
      trial?.trial_index,
      trial?.outcome,
    ]);
    expect(values).toEqual(
      expect.arrayContaining([
        trial?.duration_ms,
        trial?.duration_api_ms,
        trial?.tokens.input,
        trial?.tokens.output,
        trial?.cost_usd_reported,
        trial?.transcript?.sha256,
      ]),
    );
    expect(values.slice(-3)).toEqual([
      '2027-01-04T09:05:00.000Z',
      'skills/1',
      trial?.detail,
    ]);
  });

  it('changes nothing when the same envelope is already stored', async () => {
    const { client, queries } = fakeClient({ storedSha: SHA });

    expect(await ingestEnvelope({ client, envelope, sha256: SHA })).toEqual({
      result: 'present',
      rows: { subjects: 0, tasks: 0, trials: 0 },
    });
    expect(statements(queries)).toEqual([
      'begin',
      'evals.eval_run',
      'evals.eval_run',
      'rollback',
    ]);
  });

  it('reports a conflict when the stored run came from a different envelope', async () => {
    const { client } = fakeClient({ storedSha: 'b'.repeat(64) });

    expect(await ingestEnvelope({ client, envelope, sha256: SHA })).toEqual({
      result: 'conflict',
      rows: { subjects: 0, tasks: 0, trials: 0 },
    });
  });

  it('rolls back and rethrows when a write fails', async () => {
    const { client, queries } = fakeClient({ failOn: 'evals.eval_trial ' });

    await expect(
      ingestEnvelope({ client, envelope, sha256: SHA }),
    ).rejects.toThrow('failed on evals.eval_trial ');
    expect(queries.at(-1)?.text).toBe('rollback');
  });

  it('refuses a task whose subject the envelope does not declare', async () => {
    const { client, queries } = fakeClient();

    await expect(
      ingestEnvelope({
        client,
        envelope: { ...envelope, subjects: [] },
        sha256: SHA,
      }),
    ).rejects.toThrow(
      'task skills/react-19/trigger-1 names subject skill/react-19, which no entry in subjects declares',
    );
    expect(queries.at(-1)?.text).toBe('rollback');
  });
});
