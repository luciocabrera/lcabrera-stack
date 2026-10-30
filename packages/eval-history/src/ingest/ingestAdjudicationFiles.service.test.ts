import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { AdjudicationEnvelope } from '../envelope/envelope.types.ts';
import type { IngestClient } from './ingest.types.ts';
import type { readAdjudicationFile } from './readAdjudicationFile.service.ts';

import { adjudicationEnvelopeSchema } from '../envelope/adjudicationEnvelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { ingestAdjudicationFiles } from './ingestAdjudicationFiles.service.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const envelope: AdjudicationEnvelope = adjudicationEnvelopeSchema.parse(
  fixtures.get('adjudication.json'),
);

const caseIdOf = (file: string) => file.replace(/\.json$/u, '');

const fakeRead: typeof readAdjudicationFile = async ({ file }) =>
  file === 'FP-9999.json'
    ? { file, ok: false, problems: ['case: required'] }
    : {
        envelope: {
          ...envelope,
          case: { ...envelope.case, case_id: caseIdOf(file) },
        },
        file,
        ok: true,
        sha256: 'a'.repeat(64),
      };

type ClientArgs = {
  readonly failOn?: string;
  readonly storedSha?: string;
};

const fakeClient = ({ failOn, storedSha }: ClientArgs = {}): IngestClient => ({
  query: async ({ text, values }) => {
    if (failOn && values?.[0] === failOn) {
      throw new Error('relation "evals.adjudication_case" does not exist');
    }

    if (text.includes('insert into evals.adjudication_case')) {
      return { rows: storedSha ? [] : [{ case_id: values?.[0] }] };
    }

    return {
      rows: text.includes('select envelope_sha256')
        ? [{ envelope_sha256: storedSha }]
        : [],
    };
  },
});

const connection = (client: IngestClient) => {
  const end = vi.fn(async () => {});

  return { connect: async () => ({ client, end }), end };
};

const clock = () => 0;

describe('ingestAdjudicationFiles', () => {
  it('opens no connection when there are no case files', async () => {
    const connect = vi.fn();

    expect(
      await ingestAdjudicationFiles({ connect, files: [], read: fakeRead }),
    ).toEqual([]);
    expect(connect).not.toHaveBeenCalled();
  });

  it('stores each case over one connection and closes it', async () => {
    const { connect, end } = connection(fakeClient());

    expect(
      await ingestAdjudicationFiles({
        clock,
        connect,
        files: ['FP-0001.json', 'FP-0002.json'],
        read: fakeRead,
      }),
    ).toEqual(
      ['FP-0001', 'FP-0002'].map((caseId) => ({
        caseId,
        durationMs: 0,
        file: `${caseId}.json`,
        problems: [],
        result: 'inserted',
        rows: { cases: 1, verdicts: 3 },
      })),
    );
    expect(end).toHaveBeenCalledOnce();
  });

  it('rejects an invalid file without sending it', async () => {
    const { connect } = connection(fakeClient());

    expect(
      await ingestAdjudicationFiles({
        clock,
        connect,
        files: ['FP-9999.json'],
        read: fakeRead,
      }),
    ).toEqual([
      {
        caseId: undefined,
        durationMs: 0,
        file: 'FP-9999.json',
        problems: ['case: required'],
        result: 'rejected',
        rows: { cases: 0, verdicts: 0 },
      },
    ]);
  });

  it('names a case stored from a different envelope as a conflict', async () => {
    const { connect } = connection(fakeClient({ storedSha: 'b'.repeat(64) }));
    const [report] = await ingestAdjudicationFiles({
      clock,
      connect,
      files: ['FP-0001.json'],
      read: fakeRead,
    });

    expect(report).toMatchObject({
      problems: [
        'a case with this case_id is already stored from a different envelope',
      ],
      result: 'conflict',
    });
  });

  it('reports a failed case and goes on to the next', async () => {
    const { connect } = connection(fakeClient({ failOn: 'FP-0001' }));
    const reports = await ingestAdjudicationFiles({
      clock,
      connect,
      files: ['FP-0001.json', 'FP-0002.json'],
      read: fakeRead,
    });

    expect(reports.map(({ result }) => result)).toEqual(['failed', 'inserted']);
    expect(reports[0]?.problems).toEqual([
      'relation "evals.adjudication_case" does not exist',
    ]);
  });

  it('leaves every case unsent, by case id, when the database is unreachable', async () => {
    expect(
      await ingestAdjudicationFiles({
        clock,
        connect: async () => {
          throw new Error('connect ECONNREFUSED 127.0.0.1:1');
        },
        files: ['FP-0001.json'],
        read: fakeRead,
      }),
    ).toEqual([
      {
        caseId: 'FP-0001',
        durationMs: 0,
        file: 'FP-0001.json',
        problems: ['could not connect: connect ECONNREFUSED 127.0.0.1:1'],
        result: 'unsent',
        rows: { cases: 0, verdicts: 0 },
      },
    ]);
  });
});
