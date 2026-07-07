import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getScanAppGraphSummary } from './getScanAppGraphSummary.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';

const masterFixture = {
  analyzed_file_count: 1,
  file_count: 2,
  folder_count: 2,
  max_depth: 2,
  total_export_count: 3,
  total_function_count: 2,
  total_line_count: 160,
  total_node_count: 4,
  total_type_count: 1,
};

const nodesFixture = [
  {
    child_file_count: 1,
    child_folder_count: 1,
    export_count: 0,
    extension: '',
    function_count: 0,
    name: 'repo',
    nested_level: 0,
    node_id: 1,
    node_type: 'folder',
    path: '.',
    type_count: 0,
  },
  {
    child_file_count: 1,
    child_folder_count: 0,
    export_count: 0,
    extension: '',
    function_count: 0,
    name: 'src',
    nested_level: 1,
    node_id: 2,
    node_type: 'folder',
    parent_node_id: 1,
    path: 'src',
    type_count: 0,
  },
  {
    child_file_count: 0,
    child_folder_count: 0,
    export_count: 3,
    extension: '.ts',
    file_type_category: 'util',
    function_count: 2,
    line_count: 120,
    name: 'a.util.ts',
    nested_level: 2,
    node_id: 3,
    node_type: 'file',
    parent_node_id: 2,
    path: 'src/a.util.ts',
    type_count: 1,
  },
  {
    child_file_count: 0,
    child_folder_count: 0,
    export_count: 0,
    extension: '.md',
    file_type_category: 'other',
    function_count: 0,
    line_count: 40,
    name: 'README.md',
    nested_level: 1,
    node_id: 4,
    node_type: 'file',
    parent_node_id: 1,
    path: 'README.md',
    type_count: 0,
  },
];

describe('getScanAppGraphSummary', () => {
  let projectDir: string;
  let projectId: string;
  let scanId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-app-graph-summary-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2, $3) AS fn_upsert_project',
      [systemUserId, 'app-graph-summary-test-project', projectDir],
    );
    projectId = projectResult.rows[0]?.fn_upsert_project ?? '';

    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['app-graph'],
      userId: systemUserId,
    });
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.v_scans WHERE run_id = $1',
      [runId],
    );
    scanId = scanRow.rows[0]?.id ?? '';

    // Real procedure call — the same path ingestScanDetail takes.
    await pool.query('CALL cqms.sp_ingest_app_graph($1, $2, $3, $4)', [
      systemUserId,
      scanId,
      JSON.stringify(masterFixture),
      JSON.stringify(nodesFixture),
    ]);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('returns the master row with matching detail-view counts and one root', async () => {
    const summary = await getScanAppGraphSummary({ scanId });

    expect(summary).toEqual({
      analyzed_file_count: 1,
      detail_file_count: 2,
      detail_folder_count: 2,
      detail_node_count: 4,
      file_count: 2,
      folder_count: 2,
      max_depth: 2,
      root_node_count: 1,
      total_export_count: 3,
      total_function_count: 2,
      total_line_count: 160,
      total_node_count: 4,
      total_type_count: 1,
    });
  });

  it('links children to parents through (scan_id, node_id)', async () => {
    const pool = getPool();
    const children = await pool.query<{
      child_path: string;
      parent_path: string;
    }>(
      `SELECT c.path AS child_path, p.path AS parent_path
       FROM cqms.v_app_graph_nodes c
       JOIN cqms.v_app_graph_nodes p
         ON p.scan_id = c.scan_id AND p.node_id = c.parent_node_id
       WHERE c.scan_id = $1
       ORDER BY c.path`,
      [scanId],
    );

    expect(children.rows).toEqual([
      { child_path: 'README.md', parent_path: '.' },
      { child_path: 'src', parent_path: '.' },
      { child_path: 'src/a.util.ts', parent_path: 'src' },
    ]);
  });

  it('re-ingestion is idempotent (DELETE-then-INSERT)', async () => {
    const pool = getPool();
    await pool.query('CALL cqms.sp_ingest_app_graph($1, $2, $3, $4)', [
      systemUserId,
      scanId,
      JSON.stringify({
        ...masterFixture,
        file_count: 1,
        total_node_count: 2,
      }),
      JSON.stringify(nodesFixture.slice(0, 2)),
    ]);

    const summary = await getScanAppGraphSummary({ scanId });
    expect(summary).toMatchObject({
      detail_node_count: 2,
      file_count: 1,
      root_node_count: 1,
      total_node_count: 2,
    });
  });

  it('returns undefined for a scan without an app-graph master row', async () => {
    const summary = await getScanAppGraphSummary({
      scanId: '00000000-0000-0000-0000-000000000000',
    });
    expect(summary).toBeUndefined();
  });
});
