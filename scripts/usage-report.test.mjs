/*
 * What the CLI writes into the snapshot as observed, which is the one value in
 * this report that cannot be corrected later: the merge is monotone and nothing
 * prunes, so a span over days no run read is permanent, and it reads as the
 * opposite of the truth — not "unobserved" but "observed and empty".
 *
 * The unit cases beside `observationFor` pin the decision; these pin the wiring,
 * because the decision is only worth anything if the CLI hands it the real clock
 * and its own retention. Both routes run against a synthetic `HOME` holding one
 * transcript, so the transcripts are genuinely readable — a run that could not
 * read them records no span for a reason that has nothing to do with the fix,
 * and would pass either way.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { resolveRetention } from './lib/usage-args.mjs';
import { transcriptDirectoryFor } from './lib/usage-scope.mjs';
import { dayOf, shiftDay } from './lib/usage-window.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(REPO_ROOT, 'scripts', 'usage-report.mjs');

const today = () => dayOf(new Date().toISOString());

const transcriptLine = () =>
  JSON.stringify({
    cwd: REPO_ROOT,
    message: {
      content: [
        { input: { skill: 'unslop' }, name: 'Skill', type: 'tool_use' },
      ],
    },
    timestamp: new Date().toISOString(),
  });

const workspace = () => {
  const root = mkdtempSync(join(tmpdir(), 'usage-report-'));
  const home = join(root, 'home');
  const projects = join(
    home,
    '.claude',
    'projects',
    transcriptDirectoryFor(REPO_ROOT),
  );
  mkdirSync(projects, { recursive: true });
  writeFileSync(join(projects, 'session.jsonl'), `${transcriptLine()}\n`);
  return {
    home,
    out: join(root, 'out'),
    retentionDays: resolveRetention({
      args: {},
      repoRoot: REPO_ROOT,
      userHome: home,
    }).days,
    snapshotPath: join(root, 'snapshot.json'),
  };
};

const seedSnapshot = ({ retention, snapshotPath }) =>
  writeFileSync(
    snapshotPath,
    `${JSON.stringify({
      days: { skills: {}, subagents: {} },
      observed: [],
      retention,
      updatedAt: '2020-01-01T00:00:00.000Z',
      version: 1,
    })}\n`,
  );

const run = ({ args = [], home, out, snapshotPath }) => {
  const finished = spawnSync(
    process.execPath,
    [SCRIPT, '--out', out, '--snapshot', snapshotPath, ...args],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        GH_CONFIG_DIR: join(home, 'gh'),
        GH_TOKEN: '',
        GITHUB_TOKEN: '',
        HOME: home,
      },
    },
  );
  return {
    report: JSON.parse(readFileSync(join(out, 'harness-usage.json'), 'utf8')),
    snapshot: JSON.parse(readFileSync(snapshotPath, 'utf8')),
    status: finished.status,
    stderr: finished.stderr,
  };
};

describe('usage-report observed spans', () => {
  it('records the horizon it read when the retention it has been seeing still holds', () => {
    const workspaceUnderTest = workspace();
    const { retentionDays, snapshotPath } = workspaceUnderTest;
    seedSnapshot({
      retention: { days: retentionDays, since: '2020-01-01' },
      snapshotPath,
    });

    const { report, snapshot, status, stderr } = run(workspaceUnderTest);

    expect(status, stderr).toBe(0);
    expect(report.transcripts.available).toBe(true);
    expect(snapshot.observed).toEqual([
      { from: shiftDay(today(), -(retentionDays - 1)), to: today() },
    ]);
  });

  it('claims no day the retention in force before this run had already deleted', () => {
    const workspaceUnderTest = workspace();
    const { retentionDays, snapshotPath } = workspaceUnderTest;
    seedSnapshot({
      retention: { days: retentionDays + 1, since: '2020-01-01' },
      snapshotPath,
    });

    const { report, snapshot } = run(workspaceUnderTest);

    expect(report.transcripts.retentionDays).toBe(retentionDays);
    expect(report.transcripts.available).toBe(true);
    expect(snapshot.observed).toEqual([{ from: today(), to: today() }]);
    expect(snapshot.retention).toEqual({
      days: retentionDays,
      since: today(),
    });
  });

  it('records no span at all for a run told to date itself in the past', () => {
    const workspaceUnderTest = workspace();
    const { retentionDays, snapshotPath } = workspaceUnderTest;
    const seeded = { days: retentionDays, since: '2020-01-01' };
    seedSnapshot({ retention: seeded, snapshotPath });

    const { report, snapshot, status } = run({
      ...workspaceUnderTest,
      args: ['--now', `${shiftDay(today(), -20)}T00:00:00Z`],
    });

    expect(status).toBe(0);
    expect(report.transcripts.available).toBe(true);
    expect(snapshot.observed).toEqual([]);
    expect(snapshot.retention).toEqual(seeded);
  });
});
