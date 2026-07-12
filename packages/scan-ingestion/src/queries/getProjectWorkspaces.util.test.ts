import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getProjectWorkspaces } from './getProjectWorkspaces.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { replaceProjectWorkspaces } from './replaceProjectWorkspaces.util.ts';
import { triggerScan } from './triggerScan.util.ts';

type MakeGenericFindingArgs = {
  readonly findingId: string;
  readonly locationPath: string;
};

const makeGenericFinding = ({
  findingId,
  locationPath,
}: MakeGenericFindingArgs) => ({
  confidence: 'high',
  extra: {},
  finding_id: findingId,
  finding_kind: 'single_location',
  fix: 'Fix it.',
  location_path: locationPath,
  rule_id: 'CC.G5',
  severity: 'MEDIUM',
  // Required since 0017: the procedure's recordset now reads status
  // (jsonb_to_recordset applies no column DEFAULTs), relying on
  // reportSchema's `.default('open')` — a hand-built payload must honor
  // the same contract.
  status: 'open',
  verification_steps: [],
  why: 'Because.',
});

describe('getProjectWorkspaces + workspace attribution (ADR-021)', () => {
  let projectDir: string;
  let projectId: string;
  let runId: string;
  let scanId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-workspaces-db-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'workspaces-test-project'],
    );
    projectId = projectResult.rows[0]?.fn_register_project ?? '';

    // Triggering requires a synced snapshot (0027) — record one
    // pointing at the temp dir.
    await pool.query(
      'SELECT * FROM cqms.fn_set_project_snapshot($1, $2, $3, $4, $5, $6, $7)',
      [systemUserId, projectId, projectDir, 'test.zip', 42, 1, 'test'],
    );

    // Overlapping paths on purpose — attribution must pick the LONGEST
    // matching prefix, so packages/ui/nested wins over packages/ui.
    await replaceProjectWorkspaces({
      projectId,
      userId: systemUserId,
      workspaces: [
        { workspace_name: '@repo/ui', workspace_path: 'packages/ui' },
        {
          workspace_name: '@repo/ui-nested',
          workspace_path: 'packages/ui/nested',
        },
        { workspace_name: undefined, workspace_path: 'apps/web' },
      ],
    });

    const triggered = await triggerScan({
      projectId,
      scannerIds: ['code-smell-checker'],
      userId: systemUserId,
      workspacePaths: ['packages/ui'],
    });
    runId = triggered.runId;
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.v_scans WHERE run_id = $1',
      [runId],
    );
    scanId = scanRow.rows[0]?.id ?? '';

    await pool.query(
      'CALL cqms.sp_ingest_scan_result($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        systemUserId,
        scanId,
        runId,
        '# report',
        JSON.stringify({ report_id: 'ws-attr-test' }),
        JSON.stringify({
          blocker_count: 0,
          files_analyzed: 4,
          generated_at: '2026-07-07T00:00:00.000Z',
          high_count: 0,
          low_count: 0,
          medium_count: 4,
          nit_count: 0,
          report_id: 'ws-attr-test',
        }),
        JSON.stringify([
          makeGenericFinding({
            findingId: 'F-001',
            locationPath: 'packages/ui/src/Button.tsx',
          }),
          makeGenericFinding({
            findingId: 'F-002',
            locationPath: 'packages/ui/nested/src/deep.ts',
          }),
          makeGenericFinding({
            findingId: 'F-003',
            locationPath: 'apps/web/src/main.tsx',
          }),
          makeGenericFinding({ findingId: 'F-004', locationPath: 'README.md' }),
        ]),
        undefined,
      ],
    );
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('returns the persisted snapshot ordered by path', async () => {
    const workspaces = await getProjectWorkspaces({ projectId });

    expect(workspaces.map((workspace) => workspace.workspace_path)).toEqual([
      'apps/web',
      'packages/ui',
      'packages/ui/nested',
    ]);
    // The nameless workspace round-trips as SQL NULL.
    expect(workspaces[0]?.workspace_name).toBeNull();
    expect(workspaces[1]?.workspace_name).toBe('@repo/ui');
    expect(workspaces[2]?.workspace_name).toBe('@repo/ui-nested');
  });

  it('created a folder-scoped scan for the selected workspace', async () => {
    const pool = getPool();
    const scan = await pool.query<{ scope_type: string; scope_value: string }>(
      'SELECT scope_type, scope_value FROM cqms.v_scans WHERE id = $1',
      [scanId],
    );
    expect(scan.rows[0]).toEqual({
      scope_type: 'folder',
      scope_value: 'packages/ui',
    });
  });

  it('attributes findings by longest workspace prefix, NULL for unmatched', async () => {
    const pool = getPool();
    const attribution = await pool.query<{
      location_path: string;
      workspace_path: null | string;
    }>(
      `SELECT location_path, workspace_path
       FROM cqms.scan_finding_workspaces
       WHERE scan_id = $1`,
      [scanId],
    );

    // Order-independent — DB collation ordering is not the assertion here.
    const workspaceByPath = new Map(
      attribution.rows.map((row) => [row.location_path, row.workspace_path]),
    );
    expect(workspaceByPath.size).toBe(4);
    expect(workspaceByPath.get('README.md')).toBeNull();
    expect(workspaceByPath.get('apps/web/src/main.tsx')).toBe('apps/web');
    expect(workspaceByPath.get('packages/ui/nested/src/deep.ts')).toBe(
      'packages/ui/nested',
    );
    expect(workspaceByPath.get('packages/ui/src/Button.tsx')).toBe(
      'packages/ui',
    );
  });

  it('re-replacement is idempotent and wholesale (DELETE-then-INSERT)', async () => {
    await replaceProjectWorkspaces({
      projectId,
      userId: systemUserId,
      workspaces: [{ workspace_name: 'only', workspace_path: 'apps/only' }],
    });

    const workspaces = await getProjectWorkspaces({ projectId });
    expect(workspaces).toEqual([
      { workspace_name: 'only', workspace_path: 'apps/only' },
    ]);
  });
});
