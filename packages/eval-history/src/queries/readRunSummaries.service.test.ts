import { describe, expect, it } from 'vite-plus/test';

import { readRunSummaries } from './readRunSummaries.service.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const RUN_COLUMNS = [
  'run_id',
  'suite',
  'trigger',
  'branch',
  'git_sha',
  'git_dirty',
  'pr_number',
  'started_at',
  'finished_at',
  'status',
  'model_id',
  'harness_version',
  'sdk_version',
];

const TRIAL_COLUMNS = ['run_id', 'outcome', 'cost_usd_reported'];

const COLUMNS = [
  ...RUN_COLUMNS.map((column) => ({ column, table: 'eval_run' })),
  ...TRIAL_COLUMNS.map((column) => ({ column, table: 'eval_trial' })),
].map((column) => ({ ...column, dataType: 'integer', udtName: 'int4' }));

const row = {
  arch: 'x64',
  branch: 'main',
  ciRunner: 'ubuntu-latest',
  concurrency: 1,
  costUsd: 0.25,
  finishedAt: new Date('2026-10-01T02:40:00Z'),
  gitDirty: false,
  gitSha: 'a'.repeat(40),
  harnessVersion: 'abcdefabcdef',
  k: 3,
  maxTurns: 20,
  modelId: 'model-a',
  n: 4,
  node: 'v26',
  os: 'linux',
  prNumber: 12,
  runId: '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50',
  runs: 3,
  sdkVersion: '1.0.0',
  startedAt: new Date('2026-10-01T02:00:00Z'),
  status: 'complete',
  suite: 'skills',
  timeoutMs: 60_000,
  trials: 5,
  trigger: 'ci-scheduled',
};

describe('readRunSummaries', () => {
  it('derives the public columns first, then reads the runs', async () => {
    const { client, sent } = scriptedClient({
      answer: () => [row],
      columns: COLUMNS,
    });

    expect(
      await readRunSummaries({
        client,
        scope: { kind: 'recent', perSuite: 5 },
      }),
    ).toEqual([row]);
    expect(sent.map(({ values }) => values)).toEqual([[], [5]]);
  });

  it('refuses to read when the schema no longer makes a column public', async () => {
    const { client } = scriptedClient({
      answer: () => [row],
      columns: COLUMNS.filter(({ column }) => column !== 'branch'),
    });

    await expect(
      readRunSummaries({ client, scope: { kind: 'run', runId: row.runId } }),
    ).rejects.toThrow('eval_run.branch is not on the public allow-list');
  });

  it('rejects a row of an unknown suite', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...row, suite: 'other' }],
      columns: COLUMNS,
    });

    await expect(
      readRunSummaries({ client, scope: { kind: 'run', runId: row.runId } }),
    ).rejects.toThrow();
  });
});
