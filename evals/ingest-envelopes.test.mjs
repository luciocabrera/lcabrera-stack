import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const SCRIPT = fileURLToPath(new URL('ingest-envelopes.mjs', import.meta.url));

const runIngest = (args) =>
  spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '' },
  });

describe('evals:ingest', () => {
  it.each([['--quiet'], ['--quiet-unreachable=x']])(
    'rejects %s with one line and exit 1',
    (flag) => {
      const { status, stderr } = runIngest([flag]);
      expect(status).toBe(1);
      expect(stderr.trim().split('\n')).toHaveLength(1);
      expect(stderr).toMatch(/^evals:ingest: /u);
      expect(stderr).not.toMatch(/\n\s+at /u);
    },
  );
});
