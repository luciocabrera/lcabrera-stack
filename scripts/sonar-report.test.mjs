/**
 * The exit code of a tokenless run, which is the only thing the required
 * `Strict Sonar issue gate` check reads.
 *
 * What it defends: the token check returns before any analysis is looked for, so
 * `--require-analysis` on its own never sees it. A merge-queue build whose
 * secret was missing or rotated would then exit 0 having read nothing, in front
 * of the merge — indistinguishable, in the check UI, from a clean project. Both
 * outcomes are planted here because a run that HAS a token exits 0 either way
 * and so can prove nothing about the flag.
 *
 * The script's other fail-or-skip branch — the `--wait` timeout — is NOT covered
 * here, and the reason is cost rather than impossibility. It is reachable
 * locally: `CONFIG.base` reads `SONAR_BASE_URL`, so a stub answering
 * `/api/ce/activity` with `{"tasks": []}` drives `waitForAnalysis` to its
 * timeout. What a case would have to pay for is the route in. `analysisReady`,
 * which holds the two messages and the exit code, is not exported, so the only
 * entry is the CLI; and the poll bounds are module constants in
 * `lib/sonar-wait.mjs` (`WAIT_TIMEOUT_MS` 5 minutes, `WAIT_INTERVAL_MS` 15
 * seconds), so the CLI takes five minutes of wall clock to get there. Covering it
 * means making those two injectable or exporting the branch — a change to the
 * script's shape, not to this file, and not this pull request's subject.
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const SCRIPT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'sonar-report.mjs',
);

// SONAR_TOKEN is emptied rather than deleted: the script loads a gitignored root
// environment file if one is present, and `process.loadEnvFile` leaves alone a
// variable the environment already carries — so this holds on a machine that
// has one.
const run = (...flags) =>
  spawnSync(
    process.execPath,
    [SCRIPT, '--gate', '--fail-on-issues', '--pr', '1038', '--wait', ...flags],
    { encoding: 'utf8', env: { ...process.env, SONAR_TOKEN: '' } },
  );

describe('a run with no SONAR_TOKEN', () => {
  it('fails under --require-analysis, which implies --require-token', () => {
    const result = run('--require-analysis');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('SONAR_TOKEN is required');
  });

  it('fails under --require-token', () => {
    expect(run('--require-token').status).toBe(1);
  });

  it('skips green only where no secret exists: a fork pull request', () => {
    const result = run();
    expect(result.status).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Gate skipped (not failed)',
    );
  });
});
