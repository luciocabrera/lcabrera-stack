import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { IngestClient } from './ingest.types.ts';
import type { readEnvelopeFile } from './readEnvelopeFile.service.ts';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { ingestFiles } from './ingestFiles.service.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const envelope: RunEnvelope = runEnvelopeSchema.parse(
  fixtures.get('skills.json'),
);

const startedAt = (file: string) =>
  file === 'late.json' ? '2026-10-07T00:00:00.000Z' : envelope.run.started_at;

const read: typeof readEnvelopeFile = async ({ file }) =>
  file === 'bad.json'
    ? { file, ok: false, problems: ['run: required'] }
    : {
        envelope: {
          ...envelope,
          run: { ...envelope.run, started_at: startedAt(file) },
        },
        file,
        ok: true,
        sha256: 'a'.repeat(64),
      };

const RUN_ROWS = (values?: readonly unknown[]) => [{ run_id: values?.[0] }];

const ROWS_BY_TABLE = [
  ['evals.eval_subject_version', () => [{ id: 1, subject_id: 1 }]],
  ['evals.eval_task_version', () => [{ id: 1 }]],
  ['insert into evals.eval_run', RUN_ROWS],
] as const;

const recordingClient = (failOn?: string) => {
  const runs: unknown[] = [];
  const client: IngestClient = {
    query: async ({ text, values }) => {
      const isRun = text.includes('insert into evals.eval_run');

      if (isRun) {
        runs.push(values?.[9]);
      }

      if (isRun && failOn && values?.[9] === failOn) {
        throw Object.assign(new Error('relation missing'), { code: '42P01' });
      }

      const match = ROWS_BY_TABLE.find(([marker]) => text.includes(marker));

      return { rows: match ? match[1](values) : [] };
    },
  };

  return { client, runs };
};

const clock = () => 0;

describe('ingestFiles', () => {
  it('sends readable envelopes oldest first over one connection, and closes it', async () => {
    const { client, runs } = recordingClient();
    const end = vi.fn(async () => undefined);
    const connect = vi.fn(async () => ({ client, end }));

    const reports = await ingestFiles({
      clock,
      connect,
      files: ['late.json', 'early.json', 'bad.json'],
      read,
    });

    expect(reports.map(({ file, result }) => [file, result])).toEqual([
      ['bad.json', 'rejected'],
      ['early.json', 'inserted'],
      ['late.json', 'inserted'],
    ]);
    expect(runs).toEqual([envelope.run.started_at, '2026-10-07T00:00:00.000Z']);
    expect(connect).toHaveBeenCalledOnce();
    expect(end).toHaveBeenCalledOnce();
  });

  it('marks every envelope unsent when the database cannot be reached', async () => {
    const reports = await ingestFiles({
      clock,
      connect: async () => {
        throw Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5434'), {
          code: 'ECONNREFUSED',
        });
      },
      files: ['early.json'],
      read,
    });

    expect(reports).toEqual([
      {
        durationMs: 0,
        file: 'early.json',
        problems: ['could not connect: connect ECONNREFUSED 127.0.0.1:5434'],
        result: 'unsent',
        rows: { subjects: 0, tasks: 0, trials: 0 },
        runId: envelope.run.run_id,
        suite: 'skills',
      },
    ]);
  });

  it('records a failed run and carries on with the next', async () => {
    const { client } = recordingClient(envelope.run.started_at);

    const reports = await ingestFiles({
      clock,
      connect: async () => ({ client, end: async () => undefined }),
      files: ['early.json', 'late.json'],
      read,
    });

    expect(reports.map(({ problems, result }) => [result, problems])).toEqual([
      ['failed', ['42P01: relation missing']],
      ['inserted', []],
    ]);
  });

  it('does not connect when nothing is readable', async () => {
    const connect = vi.fn();

    await ingestFiles({ clock, connect, files: ['bad.json'], read });

    expect(connect).not.toHaveBeenCalled();
  });
});
