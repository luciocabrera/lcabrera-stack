import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { closePool, getPool } from '@repo/server/db/get-pool.util';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getScanCodeSmellSummary } from './getScanCodeSmellSummary.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';

const masterFixture = {
  blocker_count: 0,
  confidence_high_count: 2,
  confidence_low_count: 0,
  confidence_medium_count: 0,
  effort_large_count: 0,
  effort_medium_count: 1,
  effort_small_count: 1,
  files_analyzed: 12,
  finding_count: 2,
  generated_at: '2026-07-07T00:00:00.000Z',
  high_count: 1,
  low_count: 0,
  medium_count: 1,
  nit_count: 0,
  report_id: 'code-smell-checker-test',
  rules_flagged_count: 2,
  top_risk: 'Deep nesting.',
};

// Exact field list of sp_ingest_scan_result's jsonb_to_recordset — every
// NOT-NULL-with-DEFAULT column (verification_steps/finding_kind/extra) is
// emitted explicitly because the recordset never applies DEFAULTs.
type MakeGenericFindingArgs = {
  readonly findingId: string;
  readonly ruleId: string;
};

const makeGenericFinding = ({ findingId, ruleId }: MakeGenericFindingArgs) => ({
  confidence: 'high',
  defer_risk: undefined,
  dependencies: ['land F-000 first'],
  effort: 'small',
  evidence_excerpt: undefined,
  extra: {},
  finding_id: findingId,
  finding_kind: 'single_location',
  fix: 'Fix it.',
  location_hint: '1:1',
  location_path: 'src/a.ts',
  owner: 'zz-team',
  related_findings: ['F-000'],
  rule_id: ruleId,
  // Required since 0017: the procedure's recordset now reads status
  // (jsonb_to_recordset applies no column DEFAULTs), relying on
  // reportSchema's `.default('open')` — a hand-built payload must honor
  // the same contract.
  status: 'open',
  tags: ['structure'],
  verification_steps: ['Re-run the scan.'],
  why: 'Because.',
});

describe('getScanCodeSmellSummary', () => {
  let projectDir: string;
  let projectId: string;
  let runId: string;
  let scanId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-code-smell-summary-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'code-smell-summary-test-project'],
    );
    projectId = projectResult.rows[0]?.fn_register_project ?? '';

    // Triggering requires a synced snapshot (0027) — record one
    // pointing at the temp dir.
    await pool.query(
      'SELECT * FROM cqms.fn_set_project_snapshot($1, $2, $3, $4, $5, $6, $7)',
      [systemUserId, projectId, projectDir, 'test.zip', 42, 1, 'test'],
    );

    const triggered = await triggerScan({
      projectId,
      scannerIds: ['code-smell-checker'],
      userId: systemUserId,
    });
    runId = triggered.runId;
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.v_scans WHERE run_id = $1',
      [runId],
    );
    scanId = scanRow.rows[0]?.id ?? '';

    // Real generic-layer ingest so the scanner-filtered findings VIEW has
    // rows to project — the same procedure ingestReport calls.
    await pool.query(
      'CALL cqms.sp_ingest_scan_result($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        systemUserId,
        scanId,
        runId,
        '# report',
        JSON.stringify({ report_id: 'code-smell-checker-test' }),
        JSON.stringify({
          blocker_count: 0,
          files_analyzed: 12,
          generated_at: '2026-07-07T00:00:00.000Z',
          high_count: 1,
          low_count: 0,
          medium_count: 1,
          nit_count: 0,
          report_id: 'code-smell-checker-test',
          top_risk: 'Deep nesting.',
        }),
        JSON.stringify([
          {
            ...makeGenericFinding({ findingId: 'F-001', ruleId: 'CC.G5' }),
            severity: 'HIGH',
          },
          {
            ...makeGenericFinding({ findingId: 'F-002', ruleId: 'CC.G7' }),
            severity: 'MEDIUM',
          },
        ]),
        undefined,
      ],
    );

    // The new master procedure — the same path ingestScanDetail takes.
    await pool.query(
      'CALL cqms.sp_ingest_code_smell_checker_detail($1, $2, $3)',
      [systemUserId, scanId, JSON.stringify(masterFixture)],
    );
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('returns the master rollup with the detail view lining up', async () => {
    const summary = await getScanCodeSmellSummary({
      scanId,
      scannerId: 'code-smell-checker',
    });

    expect(summary).toEqual({
      blocker_count: 0,
      confidence_high_count: 2,
      confidence_low_count: 0,
      confidence_medium_count: 0,
      detail_view_finding_count: 2,
      effort_large_count: 0,
      effort_medium_count: 1,
      effort_small_count: 1,
      files_analyzed: 12,
      finding_count: 2,
      high_count: 1,
      report_id: 'code-smell-checker-test',
      rules_flagged_count: 2,
      top_risk: 'Deep nesting.',
    });
  });

  it('the zen view does not project checker findings (scanner filter)', async () => {
    const pool = getPool();
    const zenView = await pool.query(
      'SELECT 1 FROM cqms.code_smell_zen_findings WHERE scan_id = $1',
      [scanId],
    );
    expect(zenView.rows).toHaveLength(0);
  });

  it('persists dependencies/related_findings/owner/status (0017 — dropped silently before)', async () => {
    const pool = getPool();
    const row = await pool.query(
      'SELECT dependencies, related_findings, owner, status FROM cqms.scan_findings WHERE scan_id = $1 LIMIT 1',
      [scanId],
    );
    expect(row.rows[0]).toEqual({
      dependencies: ['land F-000 first'],
      owner: 'zz-team',
      related_findings: ['F-000'],
      status: 'open',
    });
  });

  it('re-ingestion is idempotent (DELETE-then-INSERT)', async () => {
    const pool = getPool();
    await pool.query(
      'CALL cqms.sp_ingest_code_smell_checker_detail($1, $2, $3)',
      [
        systemUserId,
        scanId,
        JSON.stringify({ ...masterFixture, finding_count: 5 }),
      ],
    );

    const summary = await getScanCodeSmellSummary({
      scanId,
      scannerId: 'code-smell-checker',
    });
    expect(summary?.finding_count).toBe(5);
  });

  it('returns undefined for a scan without a master row', async () => {
    const summary = await getScanCodeSmellSummary({
      scanId: '00000000-0000-0000-0000-000000000000',
      scannerId: 'code-smell-zen',
    });
    expect(summary).toBeUndefined();
  });
});
