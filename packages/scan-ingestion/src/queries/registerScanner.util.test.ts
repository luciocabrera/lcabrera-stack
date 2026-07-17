import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createScannerDetailTable } from './createScannerDetailTable.util.ts';
import { getScannerById } from './getScannerById.util.ts';
import { getScannerVersions } from './getScannerVersions.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { registerScanner } from './registerScanner.util.ts';
import { triggerScan } from './triggerScan.util.ts';
import { updateScanner } from './updateScanner.util.ts';

const TEST_SCANNER_ID = 'zz-registry-test';
const TEST_DETAIL_TABLE = 'scanner_detail_zz_registry_test';

describe('scanner registry (register/update/detail table/generic ingest)', () => {
  let projectDir: string;
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';
    projectDir = makeTempDirectory('scan-ingestion-registry-e2e-');
  });

  afterAll(async () => {
    const pool = getPool();
    // scanner_versions cascades from the scanner row; the dynamic detail
    // table is dropped explicitly (CASCADE takes the view with it).
    if (projectId) {
      await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    }
    await pool.query('DELETE FROM cqms.scanners WHERE scanner_id = $1', [
      TEST_SCANNER_ID,
    ]);
    await pool.query(`DROP TABLE IF EXISTS cqms.${TEST_DETAIL_TABLE} CASCADE`);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('registers at version 1 with a snapshot and rejects duplicates/bad ids', async () => {
    const { scannerId } = await registerScanner({
      scanner: {
        description: 'Registry E2E test scanner.',
        deterministic: true,
        display_name: 'ZZ Registry Test',
        raw_artifact_file_name: 'zz.raw.json',
        scanner_id: TEST_SCANNER_ID,
      },
      userId: systemUserId,
    });
    expect(scannerId).toBe(TEST_SCANNER_ID);

    const row = await getScannerById({ scannerId: TEST_SCANNER_ID });
    expect(row).toMatchObject({
      deterministic: true,
      display_name: 'ZZ Registry Test',
      is_active: true,
      skill_path: `.github/skills/${TEST_SCANNER_ID}`,
      version: 1,
    });

    await expect(
      registerScanner({
        scanner: {
          deterministic: false,
          display_name: 'Dup',
          scanner_id: TEST_SCANNER_ID,
        },
        userId: systemUserId,
      }),
    ).rejects.toThrow(/already exists/);

    await expect(
      registerScanner({
        scanner: {
          deterministic: false,
          display_name: 'Bad Id',
          scanner_id: 'Bad_Id!',
        },
        userId: systemUserId,
      }),
    ).rejects.toThrow(/must match/);
  });

  it('creates the sanitized generic detail table idempotently', async () => {
    const first = await createScannerDetailTable({
      scannerId: TEST_SCANNER_ID,
      userId: systemUserId,
    });
    expect(first.tableName).toBe(TEST_DETAIL_TABLE);

    const second = await createScannerDetailTable({
      scannerId: TEST_SCANNER_ID,
      userId: systemUserId,
    });
    expect(second.tableName).toBe(TEST_DETAIL_TABLE);

    const pool = getPool();
    const regClass = await pool.query<{ table_oid: null | string }>(
      `SELECT to_regclass('cqms.${TEST_DETAIL_TABLE}')::text AS table_oid`,
    );
    expect(regClass.rows[0]?.table_oid).toBe(`cqms.${TEST_DETAIL_TABLE}`);
  });

  it('update bumps the version and snapshots every state', async () => {
    const { version } = await updateScanner({
      scanner: { description: 'Updated description.' },
      scannerId: TEST_SCANNER_ID,
      userId: systemUserId,
    });
    expect(version).toBe(2);

    const versions = await getScannerVersions({
      scannerId: TEST_SCANNER_ID,
    });
    expect(versions.map((row) => row.version)).toEqual([2, 1]);
    expect(versions[0]?.snapshot.description).toBe('Updated description.');
    expect(versions[1]?.snapshot.description).toBe(
      'Registry E2E test scanner.',
    );
  });

  it('a registered scanner is scannable and generically ingestable', async () => {
    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'registry-e2e-project'],
    );
    projectId = projectResult.rows[0]?.fn_register_project ?? '';

    // Triggering requires a synced snapshot (0027) — record one
    // pointing at the temp dir.
    await pool.query(
      'SELECT * FROM cqms.fn_set_project_snapshot($1, $2, $3, $4, $5, $6, $7)',
      [systemUserId, projectId, projectDir, 'test.zip', 42, 1, 'test'],
    );

    const { runId } = await triggerScan({
      projectId,
      scannerIds: [TEST_SCANNER_ID],
      userId: systemUserId,
    });
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.v_scans WHERE run_id = $1',
      [runId],
    );
    const scanId = scanRow.rows[0]?.id ?? '';
    expect(scanId).toBeTruthy();

    // The same path ingestScanDetail's generic branch takes (ADR-023).
    await pool.query('CALL cqms.sp_ingest_generic_detail($1, $2, $3)', [
      systemUserId,
      scanId,
      JSON.stringify([
        { metric: 'a', value: 1 },
        { metric: 'b', value: 2 },
      ]),
    ]);

    const detailRows = await pool.query<{ payload: { metric: string } }>(
      `SELECT payload FROM cqms.v_${TEST_DETAIL_TABLE} WHERE scan_id = $1 ORDER BY payload->>'metric'`,
      [scanId],
    );
    expect(detailRows.rows.map((row) => row.payload.metric)).toEqual([
      'a',
      'b',
    ]);
  });
});
