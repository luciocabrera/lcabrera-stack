// @vitest-environment node

/**
 * The retention rule against a real Postgres, through the ingester and the
 * `evals:retain` script itself: which transcript pointers a pass clears, which
 * it keeps, and which content snapshots it trims. A fake client reports the
 * same green whether or not the statements select the rows they name. It
 * creates a database of its own next to the one EVALS_TEST_DATABASE_URL names
 * and drops it afterwards. Unset, it skips locally and fails under CI.
 */

import type pg from 'pg';

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { ingestEnvelope } from '../ingest/ingestEnvelope.service.ts';
import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { integrationDatabase } from '../testing/integrationDatabase.service.ts';
import { scratchConnections } from '../testing/scratchConnections.service.ts';
import { retainEvals } from './retainEvals.service.ts';

const DAY_MS = 86_400_000;

const SCRIPT = fileURLToPath(
  new URL('../../scripts/retain.mjs', import.meta.url),
);

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});

const skills = runEnvelopeSchema.parse(fixtures.get('skills.json'));

const FINISHED_MS = Date.parse(skills.run.finished_at);

type PlantArgs = {
  readonly baseline?: boolean;
  readonly branch: string;
  readonly finishedAt?: Date;
};

const plant = ({
  baseline = false,
  branch,
  finishedAt = new Date(FINISHED_MS),
}: PlantArgs): RunEnvelope =>
  runEnvelopeSchema.parse({
    ...skills,
    run: {
      ...skills.run,
      branch,
      finished_at: finishedAt.toISOString(),
      run_id: randomUUID(),
      started_at: new Date(finishedAt.getTime() - 300_000).toISOString(),
      ...(baseline && { baseline_id: randomUUID(), trigger: 'baseline' }),
    },
  });

type CountArgs = {
  readonly client: pg.Client;
  readonly runId: string;
};

const pointersOf = async ({ client, runId }: CountArgs) => {
  const { rows } = await client.query<{ readonly count: number }>({
    text: 'select count(*)::integer as count from evals.eval_trial where run_id = $1 and transcript_uri is not null',
    values: [runId],
  });

  return rows[0]?.count;
};

const { url } = integrationDatabase({ label: 'retain' });

describe.skipIf(!url)('evals:retain against Postgres', () => {
  const { close, connect, createDatabase } = scratchConnections(url ?? '');
  const runs = { baseline: '', feature: '', main: '', unexpiring: '' };
  const subjects = { long: '', short: '' };
  let database = '';
  let client: pg.Client;

  const ingest = async (envelope: RunEnvelope) => {
    await ingestEnvelope({ client, envelope, sha256: 'c'.repeat(64) });

    return envelope.run.run_id;
  };

  const insertSnapshots = async (count: number) => {
    const { rows } = await client.query<{ readonly id: string }>({
      text: "insert into evals.eval_subject (kind, name, path) values ('skill', $1, '.github/skills/x') returning id::text as id",
      values: [`retain-${randomUUID()}`],
    });
    const subjectId = rows[0]?.id ?? '';

    await client.query({
      text: `insert into evals.eval_subject_version (subject_id, content_hash, first_seen_sha, first_seen_at, content)
select $1, lpad(to_hex(n), 64, '0'), repeat('a', 40), timestamptz '2026-01-01' + n * interval '1 day', 'snapshot ' || n
from generate_series(1, $2::integer) as n`,
      values: [subjectId, count],
    });

    return subjectId;
  };

  const snapshotsOf = async (subjectId: string) => {
    const { rows } = await client.query<{ readonly content: string }>({
      text: "select coalesce(content, '') as content from evals.eval_subject_version where subject_id = $1 order by first_seen_at",
      values: [subjectId],
    });

    return rows.map(({ content }) => content);
  };

  beforeAll(async () => {
    database = await createDatabase('evals_retain');
    client = await connect(database);
    await applyMigrations({ client, migrations: await readMigrations() });

    Object.assign(runs, {
      baseline: await ingest(plant({ baseline: true, branch: 'feat/x' })),
      feature: await ingest(plant({ branch: 'feat/x' })),
      main: await ingest(plant({ branch: 'main' })),
      unexpiring: await ingest(plant({ branch: 'feat/y' })),
    });
    await client.query({
      text: 'update evals.eval_trial set transcript_expires_at = null where run_id = $1',
      values: [runs.unexpiring],
    });
    Object.assign(subjects, {
      long: await insertSnapshots(22),
      short: await insertSnapshots(3),
    });
  }, 60_000);

  afterAll(() => close());

  it('prunes nothing while every transcript is inside 90 days', async () => {
    const counts = await retainEvals({
      client,
      now: new Date(FINISHED_MS + 89 * DAY_MS),
    });

    expect(counts.transcripts).toBe(0);
    expect(await pointersOf({ client, runId: runs.feature })).toBe(
      skills.trials.length,
    );
  });

  it('prunes a 91-day-old transcript outside main and keeps main and baseline ones', async () => {
    const counts = await retainEvals({
      client,
      now: new Date(FINISHED_MS + 91 * DAY_MS),
    });

    expect(counts.transcripts).toBe(skills.trials.length * 2);
    expect(await pointersOf({ client, runId: runs.feature })).toBe(0);
    expect(await pointersOf({ client, runId: runs.unexpiring })).toBe(0);
    expect(await pointersOf({ client, runId: runs.main })).toBe(
      skills.trials.length,
    );
    expect(await pointersOf({ client, runId: runs.baseline })).toBe(
      skills.trials.length,
    );
  });

  it('clears every transcript column of a pruned trial and keeps the trial', async () => {
    const { rows } = await client.query({
      text: 'select outcome, num_nonnulls(transcript_uri, transcript_sha, transcript_bytes, transcript_expires_at) as kept from evals.eval_trial where run_id = $1 order by trial_index',
      values: [runs.feature],
    });

    expect(rows).toEqual(
      skills.trials.map(({ outcome }) => ({ kept: 0, outcome })),
    );
  });

  it('keeps the newest 20 content snapshots per subject and every version row', async () => {
    const long = await snapshotsOf(subjects.long);

    expect(long).toHaveLength(22);
    expect(long.slice(0, 2)).toEqual(['', '']);
    expect(long.slice(2)).toEqual(
      Array.from({ length: 20 }, (_, index) => `snapshot ${String(index + 3)}`),
    );
    expect(await snapshotsOf(subjects.short)).toEqual([
      'snapshot 1',
      'snapshot 2',
      'snapshot 3',
    ]);
  });

  it('runs as vp run evals:retain against a 91-day-old plant', async () => {
    const aged = new Date(Date.now() - 91 * DAY_MS);
    const feature = await ingest(plant({ branch: 'fix/y', finishedAt: aged }));
    const main = await ingest(plant({ branch: 'main', finishedAt: aged }));
    const target = new URL(url ?? '');

    target.pathname = `/${database}`;

    const result = spawnSync(process.execPath, [SCRIPT], {
      encoding: 'utf8',
      env: { EVALS_DATABASE_URL: target.href, PATH: process.env.PATH },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      `pruned ${String(skills.trials.length)} transcript pointer(s)`,
    );
    expect(await pointersOf({ client, runId: feature })).toBe(0);
    expect(await pointersOf({ client, runId: main })).toBe(
      skills.trials.length,
    );
  });
});
