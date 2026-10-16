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
});
