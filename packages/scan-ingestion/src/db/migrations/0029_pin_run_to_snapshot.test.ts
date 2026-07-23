import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { getUserByUsername } from '@repo/scan-ingestion/queries/getUserByUsername.util';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

/**
 * DB-layer proof of migration 0029 (ADR-034 / STATUS §3.4): a run must analyze
 * the snapshot it was TRIGGERED on, and a sync landing mid-run must neither swap
 * that target nor delete its tree. Exercises all four moving parts — the
 * `runs.snapshot_id` pin, the repointed `v_queued_scans`, the conditional
 * retention in `fn_set_project_snapshot`, and `fn_collect_finished_run_snapshot`.
 *
 * Storage paths are opaque strings here: this validates the DB pointer logic, not
 * the filesystem rmSync (that is the orchestrator's half). Needs a live CQMS
 * Postgres — excluded from the DB-free `test:unit` subset (vite.config.ts
 * `UNIT_ONLY`).
 */

type SetSnapshotRow = {
  readonly replaced_storage_path: null | string;
  readonly snapshot_id: string;
};

const TRIGGER_RUN = `SELECT cqms.fn_create_run_with_scans($1,$2,'ui_agent_sdk',$3,NULL,NULL,NULL,'repo','.') AS run_id`;

type TriggerRunArgs = {
  readonly projectId: string;
  readonly userId: string;
};

const triggerRun = async ({ projectId, userId }: TriggerRunArgs) => {
  const result = await getPool().query<{ run_id: string }>(TRIGGER_RUN, [
    userId,
    projectId,
    JSON.stringify(['eslint']),
  ]);
  return result.rows[0]?.run_id ?? '';
};

const queuedSnapshotPath = async (runId: string) => {
  const result = await getPool().query<{ snapshot_path: string }>(
    'SELECT snapshot_path FROM cqms.v_queued_scans WHERE run_id = $1 LIMIT 1',
    [runId],
  );
  return result.rows[0]?.snapshot_path;
};

const finishRun = async (runId: string) => {
  const pool = getPool();
  await pool.query("UPDATE cqms.scans SET status='succeeded' WHERE run_id=$1", [
    runId,
  ]);
  await pool.query('SELECT cqms.fn_finalize_run_status($1)', [runId]);
};

const collect = async (runId: string) => {
  const result = await getPool().query<{ collected: null | string }>(
    'SELECT cqms.fn_collect_finished_run_snapshot($1) AS collected',
    [runId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('fn_collect_finished_run_snapshot returned no row.');
  }
  return row.collected;
};

const snapshotExists = async (storagePath: string) => {
  const result = await getPool().query(
    'SELECT 1 FROM cqms.project_snapshots WHERE storage_path = $1',
    [storagePath],
  );
  return result.rowCount === 1;
};

describe('0029 pin runs to their snapshot (ADR-034 / STATUS §3.4)', () => {
  let userId = '';
  let projectId = '';
  const dirA = `/tmp/cqms-0029-a-${randomUUID()}`;
  const dirB = `/tmp/cqms-0029-b-${randomUUID()}`;

  const setSnapshot = async (storagePath: string) => {
    const result = await getPool().query<SetSnapshotRow>(
      'SELECT * FROM cqms.fn_set_project_snapshot($1,$2,$3,$4,$5,$6,$7)',
      [userId, projectId, storagePath, 'test.zip', 1, 1, 'test'],
    );
    return result.rows[0];
  };

  beforeAll(async () => {
    const user = await getUserByUsername({ username: 'system' });
    userId = user?.id ?? '';
    const project = await getPool().query<{ project_id: string }>(
      'SELECT cqms.fn_register_project($1,$2) AS project_id',
      [userId, `cqms-0029-${randomUUID()}`],
    );
    projectId = project.rows[0]?.project_id ?? '';
    await setSnapshot(dirA); // snapshot A becomes latest
  });

  afterAll(async () => {
    await getPool().query('DELETE FROM cqms.projects WHERE id = $1', [
      projectId,
    ]);
    await closePool();
  });

  it('pins the run to its triggered snapshot, retains it under a mid-run sync, then collects it on finish', async () => {
    const runId = await triggerRun({ projectId, userId }); // pins the latest (A)

    // The queued scan resolves to A, the triggered tree.
    expect(await queuedSnapshotPath(runId)).toBe(dirA);

    // A sync lands mid-run: B becomes latest, but A is RETAINED (NULL replaced
    // path) because a running run still pins it — failure #2 fixed.
    const synced = await setSnapshot(dirB);
    expect(synced?.replaced_storage_path).toBeNull();

    // The run STILL reads A, not the freshly-synced B — failure #1 fixed.
    expect(await queuedSnapshotPath(runId)).toBe(dirA);

    // latest-wins is preserved: the project's latest is now B.
    const project = await getPool().query<{ snapshot_path: string }>(
      'SELECT snapshot_path FROM cqms.v_projects WHERE id = $1',
      [projectId],
    );
    expect(project.rows[0]?.snapshot_path).toBe(dirB);

    // Finish the run → A is now collectable (no longer latest, nothing pins it).
    await finishRun(runId);
    expect(await collect(runId)).toBe(dirA);

    // A's row is gone, the run's pin was SET NULL ("collected"), B survives.
    expect(await snapshotExists(dirA)).toBe(false);
    const runPin = await getPool().query<{ snapshot_id: null | string }>(
      'SELECT snapshot_id FROM cqms.runs WHERE id = $1',
      [runId],
    );
    expect(runPin.rows[0]?.snapshot_id).toBeNull();
    expect(await snapshotExists(dirB)).toBe(true);

    // Collection is idempotent — nothing left to collect.
    expect(await collect(runId)).toBeNull();
  }, 20_000);

  it('never collects a snapshot that is still the project latest', async () => {
    const dir = `/tmp/cqms-0029-latest-${randomUUID()}`;
    const project = await getPool().query<{ project_id: string }>(
      'SELECT cqms.fn_register_project($1,$2) AS project_id',
      [userId, `cqms-0029-latest-${randomUUID()}`],
    );
    const pid = project.rows[0]?.project_id ?? '';
    try {
      await getPool().query(
        'SELECT * FROM cqms.fn_set_project_snapshot($1,$2,$3,$4,$5,$6,$7)',
        [userId, pid, dir, 'test.zip', 1, 1, 'test'],
      );
      const runId = await triggerRun({ projectId: pid, userId });
      await finishRun(runId);

      // No intervening sync → the pinned snapshot is still latest → keep it.
      expect(await collect(runId)).toBeNull();
      expect(await snapshotExists(dir)).toBe(true);
    } finally {
      await getPool().query('DELETE FROM cqms.projects WHERE id = $1', [pid]);
    }
  }, 20_000);
});
