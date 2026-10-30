import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { AdjudicationEnvelope } from '../envelope/envelope.types.ts';
import type { IngestClient, IngestQuery } from './ingest.types.ts';

import { adjudicationEnvelopeSchema } from '../envelope/adjudicationEnvelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { ingestAdjudication } from './ingestAdjudication.service.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const envelope: AdjudicationEnvelope = adjudicationEnvelopeSchema.parse(
  fixtures.get('adjudication.json'),
);

const SHA = 'c'.repeat(64);

const SQL_NULL: unknown = JSON.parse('null');

type FakeArgs = {
  readonly failOn?: string;
  readonly storedSha?: string;
};

const fakeClient = ({ failOn, storedSha }: FakeArgs = {}) => {
  const queries: IngestQuery[] = [];
  const client: IngestClient = {
    query: async (config) => {
      queries.push(config);

      if (failOn && config.text.includes(failOn)) {
        throw new Error(`failed on ${failOn}`);
      }

      if (config.text.includes('insert into evals.adjudication_case')) {
        return { rows: storedSha ? [] : [{ case_id: envelope.case.case_id }] };
      }

      return {
        rows: config.text.includes('select envelope_sha256')
          ? [{ envelope_sha256: storedSha }]
          : [],
      };
    },
  };

  return { client, queries };
};

const statements = (queries: readonly IngestQuery[]) =>
  queries.map(({ text }) => {
    const [table] = /evals\.\w+/u.exec(text) ?? [text.trim()];

    return table;
  });

describe('ingestAdjudication', () => {
  it('writes the case and every verdict in one transaction', async () => {
    const { client, queries } = fakeClient();

    expect(await ingestAdjudication({ client, envelope, sha256: SHA })).toEqual(
      { result: 'inserted', rows: { cases: 1, verdicts: 3 } },
    );
    expect(statements(queries)).toEqual([
      'begin',
      'evals.adjudication_case',
      'evals.adjudication_verdict',
      'commit',
    ]);
  });

  it('stores the case with its outcome, version and envelope hash', async () => {
    const { client, queries } = fakeClient();

    await ingestAdjudication({ client, envelope, sha256: SHA });

    expect(queries[1]?.values).toEqual([
      'FP-0001',
      envelope.case.finding_id,
      'eslint',
      'no-restricted-syntax',
      envelope.case.file,
      envelope.case.content_hash,
      envelope.case.base_sha,
      envelope.case.head_sha,
      1573,
      'dismissed',
      '2026-10-30T09:00:00.000Z',
      1,
      SHA,
    ]);
  });

  it('stores each verifier as one column per field, in verifier order', async () => {
    const { client, queries } = fakeClient();

    await ingestAdjudication({ client, envelope, sha256: SHA });

    expect(queries[2]?.values).toEqual([
      'FP-0001',
      ['judge', 'judge', 'adversary'],
      ['claude-opus-5-5', 'gpt-6', 'gemini-4-pro'],
      envelope.verifiers.map(({ agent_prompt_hash }) => agent_prompt_hash),
      ['FALSE_POSITIVE', 'FALSE_POSITIVE', 'FALSE_POSITIVE'],
      envelope.verifiers.map(({ evidence }) => evidence),
      [18_250, 9400, 22_100],
      [12_400, 11_800, 13_050],
      [820, 610, 940],
      [0.0421, 0.0187, SQL_NULL],
    ]);
  });

  it('changes nothing when the same envelope is already stored', async () => {
    const { client, queries } = fakeClient({ storedSha: SHA });

    expect(await ingestAdjudication({ client, envelope, sha256: SHA })).toEqual(
      { result: 'present', rows: { cases: 0, verdicts: 0 } },
    );
    expect(statements(queries)).toEqual([
      'begin',
      'evals.adjudication_case',
      'evals.adjudication_case',
      'rollback',
    ]);
  });

  it('reports a conflict when the stored case came from a different envelope', async () => {
    const { client } = fakeClient({ storedSha: 'd'.repeat(64) });

    expect(await ingestAdjudication({ client, envelope, sha256: SHA })).toEqual(
      { result: 'conflict', rows: { cases: 0, verdicts: 0 } },
    );
  });

  it('rolls back and rethrows when a verdict fails to write', async () => {
    const { client, queries } = fakeClient({
      failOn: 'evals.adjudication_verdict',
    });

    await expect(
      ingestAdjudication({ client, envelope, sha256: SHA }),
    ).rejects.toThrow('failed on evals.adjudication_verdict');
    expect(queries.at(-1)?.text).toBe('rollback');
  });
});
