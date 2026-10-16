import { describe, expect, it, vi } from 'vite-plus/test';

import { ingestAfterRun, printSummary } from './run-ingest.mjs';

const FILE =
  '.tmp/eval-results/skills/4e5aa14f-79b7-452d-be7c-66bdff258a25.json';

const fakeLog = () => ({ error: vi.fn(), log: vi.fn() });

describe('printSummary', () => {
  it('prints the structured lines to stdout and the warnings to stderr', () => {
    const log = fakeLog();
    printSummary({
      log,
      summary: { exitCode: 0, stderr: ['warn'], stdout: ['{"a":1}'] },
    });
    expect(log.log).toHaveBeenCalledWith('{"a":1}');
    expect(log.error).toHaveBeenCalledWith('warn');
  });
});

describe('ingestAfterRun', () => {
  it('sends the one file, quiet when the database is unreachable', async () => {
    const ingest = vi.fn(async () => ({ exitCode: 0, stderr: [], stdout: [] }));
    await ingestAfterRun({
      env: { EVALS_DATABASE_URL: 'postgres://localhost/evals' },
      file: FILE,
      ingest,
      log: fakeLog(),
    });
    expect(ingest).toHaveBeenCalledWith({
      connectionString: 'postgres://localhost/evals',
      paths: [FILE],
      quietUnreachable: true,
    });
  });

  it('never throws, so ingest cannot fail the run', async () => {
    const log = fakeLog();
    await expect(
      ingestAfterRun({
        env: {},
        file: FILE,
        ingest: async () => {
          throw new Error('pool exhausted');
        },
        log,
      }),
    ).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalledWith('evals:ingest: pool exhausted');
  });
});
