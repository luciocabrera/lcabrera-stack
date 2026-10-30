import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vite-plus/test';

import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { ingestPaths } from './ingestPaths.service.ts';
import { memoryFileSystem } from './memoryFileSystem.util.ts';

const URL_ = 'postgres://writer:secret@localhost:5434/eval_history';
const ENVELOPE_FILE =
  '/results/skills/4e5aa14f-79b7-452d-be7c-66bdff258a25.json';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const SKILLS_ENVELOPE = JSON.stringify(fixtures.get('skills.json'));
const CASE_FILE = '/results/adjudications/FP-0001.json';
const CASE_ENVELOPE = JSON.stringify(fixtures.get('adjudication.json'));

describe('ingestPaths', () => {
  it('warns and exits 0 without a database when told to stay quiet', async () => {
    const connect = vi.fn();

    expect(
      await ingestPaths({
        connect,
        connectionString: undefined,
        paths: [],
        quietUnreachable: true,
      }),
    ).toMatchObject({ exitCode: 0, stdout: [] });
    expect(connect).not.toHaveBeenCalled();
  });

  it('fails without a database otherwise', async () => {
    expect(
      await ingestPaths({
        connectionString: '',
        paths: [],
        quietUnreachable: false,
      }),
    ).toMatchObject({ exitCode: 1 });
  });

  it('fails on a URL that is not postgres, even when quiet', async () => {
    expect(
      await ingestPaths({
        connectionString: 'mysql://localhost/evals',
        paths: [],
        quietUnreachable: true,
      }),
    ).toEqual({
      exitCode: 1,
      stderr: [
        'evals:ingest: EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)',
      ],
      stdout: [],
    });
  });

  it('names a missing path', async () => {
    const summary = await ingestPaths({
      connect: vi.fn(),
      connectionString: URL_,
      paths: ['/nonexistent/eval-results'],
      quietUnreachable: false,
    });

    expect(summary).toEqual({
      exitCode: 1,
      stderr: [
        'evals:ingest: no such file or directory: /nonexistent/eval-results',
      ],
      stdout: [],
    });
  });

  it('logs the database by host, port and name, never by URL or password', async () => {
    const summary = await ingestPaths({
      connect: async () => {
        throw Object.assign(new Error('connect ECONNREFUSED'), {
          code: 'ECONNREFUSED',
        });
      },
      connectionString: URL_,
      fileSystem: memoryFileSystem({ [ENVELOPE_FILE]: SKILLS_ENVELOPE }),
      paths: ['/results'],
      quietUnreachable: true,
    });
    const lines = summary.stdout.map(
      (line) => JSON.parse(line) as { readonly database: string },
    );
    const output = JSON.stringify(summary);

    expect(lines.map(({ database }) => database)).toEqual([
      'localhost:5434/eval_history',
    ]);
    expect(summary.stderr.join('\n')).toContain('localhost:5434/eval_history');
    expect(output).not.toContain('secret');
    expect(output).not.toContain(URL_);
  });

  it('sends a run envelope to the run tables and a case file to the case tables', async () => {
    const statements: string[] = [];
    const summary = await ingestPaths({
      connect: async () => ({
        client: {
          query: async ({ text, values }) => {
            statements.push(/evals\.\w+/u.exec(text)?.[0] ?? text.trim());

            if (text.includes('insert into evals.eval_run')) {
              return { rows: [{ run_id: values?.[0] }] };
            }

            if (text.includes('evals.eval_subject_version')) {
              return { rows: [{ id: 1, subject_id: 1 }] };
            }

            if (text.includes('evals.eval_task_version')) {
              return { rows: [{ id: 1 }] };
            }

            return {
              rows: text.includes('insert into evals.adjudication_case')
                ? [{ case_id: values?.[0] }]
                : [],
            };
          },
        },
        end: async () => {},
      }),
      connectionString: URL_,
      fileSystem: memoryFileSystem({
        [CASE_FILE]: CASE_ENVELOPE,
        [ENVELOPE_FILE]: SKILLS_ENVELOPE,
      }),
      paths: ['/results'],
      quietUnreachable: false,
    });
    const lines = summary.stdout.map(
      (line) =>
        JSON.parse(line) as {
          readonly case_id?: string;
          readonly result: string;
          readonly run_id?: string;
        },
    );

    expect(summary.exitCode).toBe(0);
    expect(
      lines.map(({ case_id, result, run_id = case_id }) => [result, run_id]),
    ).toEqual([
      ['inserted', '4e5aa14f-79b7-452d-be7c-66bdff258a25'],
      ['inserted', 'FP-0001'],
    ]);
    expect(statements).toContain('evals.adjudication_verdict');
    expect(
      statements.filter((statement) => statement === 'commit'),
    ).toHaveLength(2);
  });
});
