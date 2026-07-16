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
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'app-graph-summary-test-project'],
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

// ADR-027: symbol nodes nested to arbitrary depth beneath a file node,
// chained via the same parent_node_id column folders/files already use.
// A separate project/scan (rather than reusing the describe above) keeps
// this fixture's deliberately-deep tree from interacting with the
// re-ingestion/idempotency assertions above.
describe('app-graph symbol nodes (ADR-027)', () => {
  let projectDir: string;
  let projectId: string;
  let scanId: string;
  let systemUserId: string;

  const symbolMasterFixture = {
    analyzed_file_count: 1,
    file_count: 1,
    folder_count: 1,
    max_depth: 4,
    total_export_count: 1,
    total_function_count: 3,
    total_line_count: 40,
    total_node_count: 10,
    total_type_count: 4,
  };

  // folder(1) -> file(2) -> function 'outer'(3, top-level exported)
  //   -> function 'inner'(4, private helper)
  //     -> function 'innerInner'(5, nested two levels deep) — proves
  //        recursion to arbitrary depth, not just one level.
  // Plus one sibling of each remaining new node_type (class/method/
  // interface/type_alias/enum) directly under the file, proving the
  // widened CHECK constraint accepts every ADR-027 kind.
  //
  // Every row explicitly emits all 5 pre-existing NOT NULL count columns
  // (child_file_count/child_folder_count/export_count/function_count/
  // type_count) plus extension — jsonb_to_recordset never applies a column
  // DEFAULT for an absent key, so a symbol row omitting any of these would
  // insert SQL NULL into a NOT NULL column and fail the whole INSERT. This
  // hand-authored fixture stands in for the real extractor, which already
  // emits these explicitly (extractAppGraphNodes.util.ts).
  const symbolNodesFixture = [
    {
      child_file_count: 1,
      child_folder_count: 0,
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
      child_file_count: 0,
      child_folder_count: 0,
      export_count: 1,
      extension: '.ts',
      file_type_category: 'util',
      function_count: 3,
      is_analyzed: true,
      line_count: 40,
      name: 'deep.ts',
      nested_level: 1,
      node_id: 2,
      node_type: 'file',
      parent_node_id: 1,
      path: 'src/deep.ts',
      type_count: 4,
    },
    {
      child_file_count: 0,
      child_folder_count: 0,
      end_line: 30,
      export_count: 0,
      extension: '',
      function_count: 0,
      is_exported: true,
      name: 'outer',
      nested_level: 2,
      node_id: 3,
      node_type: 'function',
      parent_node_id: 2,
      path: 'src/deep.ts',
      start_line: 1,
      symbol_name: 'outer',
      type_count: 0,
    },
    {
      child_file_count: 0,
      child_folder_count: 0,
      end_line: 20,
      export_count: 0,
      extension: '',
      function_count: 0,
      is_exported: false,
      name: 'inner',
      nested_level: 3,
      node_id: 4,
      node_type: 'function',
      parent_node_id: 3,
      path: 'src/deep.ts',
      start_line: 5,
      symbol_name: 'inner',
      type_count: 0,
    },
    {
      child_file_count: 0,
      child_folder_count: 0,
      end_line: 15,
      export_count: 0,
      extension: '',
      function_count: 0,
      is_exported: false,
      name: 'innerInner',
      nested_level: 4,
      node_id: 5,
      node_type: 'function',
      parent_node_id: 4,
      path: 'src/deep.ts',
      start_line: 8,
      symbol_name: 'innerInner',
      type_count: 0,
    },
    {
      child_file_count: 0,
      child_folder_count: 0,
      end_line: 35,
      export_count: 0,
      extension: '',
      function_count: 0,
      is_exported: true,
      name: 'MyClass',
      nested_level: 2,
      node_id: 6,
      node_type: 'class',
      parent_node_id: 2,
      path: 'src/deep.ts',
      start_line: 32,
      symbol_name: 'MyClass',
      type_count: 0,
    },
    {
      child_file_count: 0,
      child_folder_count: 0,
      end_line: 34,
      export_count: 0,
      extension: '',
      function_count: 0,
      is_exported: false,
      name: 'render',
      nested_level: 3,
      node_id: 7,
      node_type: 'method',
      parent_node_id: 6,
      path: 'src/deep.ts',
      start_line: 33,
      symbol_name: 'render',
      type_count: 0,
    },
    {
      child_file_count: 0,
      child_folder_count: 0,
      end_line: 38,
      export_count: 0,
      extension: '',
      function_count: 0,
      is_exported: true,
      name: 'MyInterface',
      nested_level: 2,
      node_id: 8,
      node_type: 'interface',
      parent_node_id: 2,
      path: 'src/deep.ts',
      start_line: 37,
      symbol_name: 'MyInterface',
      type_count: 0,
    },
    {
      child_file_count: 0,
      child_folder_count: 0,
      end_line: 40,
      export_count: 0,
      extension: '',
      function_count: 0,
      is_exported: true,
      name: 'MyType',
      nested_level: 2,
      node_id: 9,
      node_type: 'type_alias',
      parent_node_id: 2,
      path: 'src/deep.ts',
      start_line: 39,
      symbol_name: 'MyType',
      type_count: 0,
    },
    {
      child_file_count: 0,
      child_folder_count: 0,
      end_line: 44,
      export_count: 0,
      extension: '',
      function_count: 0,
      is_exported: true,
      name: 'MyEnum',
      nested_level: 2,
      node_id: 10,
      node_type: 'enum',
      parent_node_id: 2,
      path: 'src/deep.ts',
      start_line: 41,
      symbol_name: 'MyEnum',
      type_count: 0,
    },
  ];

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-app-graph-symbol-nodes-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'app-graph-symbol-nodes-test-project'],
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
      scannerIds: ['app-graph'],
      userId: systemUserId,
    });
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.v_scans WHERE run_id = $1',
      [runId],
    );
    scanId = scanRow.rows[0]?.id ?? '';

    await pool.query('CALL cqms.sp_ingest_app_graph($1, $2, $3, $4)', [
      systemUserId,
      scanId,
      JSON.stringify(symbolMasterFixture),
      JSON.stringify(symbolNodesFixture),
    ]);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('accepts every ADR-027 node_type under the widened CHECK constraint', async () => {
    const pool = getPool();
    const result = await pool.query<{ node_type: string }>(
      `SELECT DISTINCT node_type FROM cqms.v_app_graph_nodes
       WHERE scan_id = $1 ORDER BY node_type`,
      [scanId],
    );

    expect(result.rows.map((row) => row.node_type)).toEqual([
      'class',
      'enum',
      'file',
      'folder',
      'function',
      'interface',
      'method',
      'type_alias',
    ]);
  });

  it('resolves a private helper nested 3 levels deep back to its file by walking parent_node_id', async () => {
    const pool = getPool();
    const result = await pool.query<{
      depth: number;
      name: string;
      node_type: string;
    }>(
      `WITH RECURSIVE chain AS (
         SELECT node_id, parent_node_id, name, node_type, 0 AS depth
           FROM cqms.v_app_graph_nodes
          WHERE scan_id = $1 AND name = 'innerInner'
         UNION ALL
         SELECT n.node_id, n.parent_node_id, n.name, n.node_type, chain.depth + 1
           FROM cqms.v_app_graph_nodes n
           JOIN chain ON n.node_id = chain.parent_node_id
          WHERE n.scan_id = $1
       )
       SELECT depth, name, node_type FROM chain ORDER BY depth`,
      [scanId],
    );

    expect(result.rows).toEqual([
      { depth: 0, name: 'innerInner', node_type: 'function' },
      { depth: 1, name: 'inner', node_type: 'function' },
      { depth: 2, name: 'outer', node_type: 'function' },
      { depth: 3, name: 'deep.ts', node_type: 'file' },
      { depth: 4, name: 'repo', node_type: 'folder' },
    ]);
  });

  it('round-trips the ADR-027 symbol fields (is_exported, start_line/end_line, symbol_name)', async () => {
    const pool = getPool();
    const result = await pool.query<{
      end_line: number;
      is_exported: boolean;
      start_line: number;
      symbol_name: string;
    }>(
      `SELECT is_exported, start_line, end_line, symbol_name
         FROM cqms.v_app_graph_nodes
        WHERE scan_id = $1 AND name = 'outer'`,
      [scanId],
    );

    expect(result.rows).toEqual([
      { end_line: 30, is_exported: true, start_line: 1, symbol_name: 'outer' },
    ]);
  });
});
