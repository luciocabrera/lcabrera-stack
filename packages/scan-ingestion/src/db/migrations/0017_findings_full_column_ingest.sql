-- Findings ingest completeness (Phase-3 Step 11 final-E2E finding).
-- sp_ingest_scan_result's INSERT column list has omitted dependencies,
-- related_findings, owner and status since 0002 — reportSchema validates
-- them and cqms.scan_findings has the columns, but every ingest silently
-- dropped them (status fell back to the table DEFAULT, the other three to
-- NULL). Nothing was irrecoverable (reports.report_json archives the full
-- report verbatim), but the queryable extraction lost real fields —
-- surfaced live when a code-smell report's related_findings never reached
-- the table.
--
-- The recordset AS-clause order must mirror the INSERT column list because
-- the SELECT expands f.*. jsonb_to_recordset does NOT apply column
-- DEFAULTs, so status (NOT NULL) is safe only because reportSchema
-- defaults it to 'open' before the findings ever reach this procedure —
-- the same contract verification_steps/finding_kind/extra already rely on.

CREATE OR REPLACE PROCEDURE cqms.sp_ingest_scan_result(
  IN p_user_id uuid,
  IN p_scan_id uuid,
  IN p_run_id uuid,
  IN p_report_markdown text,
  IN p_report_json jsonb,
  IN p_report_metadata jsonb,
  IN p_findings jsonb,
  IN p_file_inventory jsonb
)
LANGUAGE plpgsql
AS $procedure$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);

  INSERT INTO cqms.reports (scan_id, report_id, generated_at, report_markdown, report_json, files_analyzed, blocker_count, high_count, medium_count, low_count, nit_count, top_risk, created_by)
  SELECT p_scan_id, r.report_id, r.generated_at, p_report_markdown, p_report_json,
         r.files_analyzed, r.blocker_count, r.high_count, r.medium_count, r.low_count, r.nit_count, r.top_risk,
         p_user_id
  FROM jsonb_to_record(p_report_metadata) AS r(
    report_id text, generated_at timestamptz, files_analyzed integer,
    blocker_count integer, high_count integer, medium_count integer,
    low_count integer, nit_count integer, top_risk text
  );

  INSERT INTO cqms.scan_findings (scan_id, finding_id, rule_id, severity, confidence, location_path, location_hint, evidence_excerpt, why, fix, effort, defer_risk, verification_steps, tags, finding_kind, extra, dependencies, related_findings, owner, status, created_by)
  SELECT p_scan_id, f.*, p_user_id FROM jsonb_to_recordset(p_findings) AS f(
    finding_id text, rule_id text, severity text, confidence text, location_path text, location_hint text,
    evidence_excerpt text, why text, fix text, effort text, defer_risk text, verification_steps jsonb,
    tags jsonb, finding_kind text, extra jsonb,
    dependencies jsonb, related_findings jsonb, owner text, status text
  );

  IF p_file_inventory IS NOT NULL THEN
    INSERT INTO cqms.run_files (run_id, file_path, file_type_category, extension, nested_level, line_count, created_by)
    SELECT p_run_id, f.*, p_user_id FROM jsonb_to_recordset(p_file_inventory) AS f(
      file_path text, file_type_category text, extension text, nested_level integer, line_count integer
    )
    ON CONFLICT (run_id, file_path) DO NOTHING;
  END IF;

  UPDATE cqms.scans
  SET status = 'succeeded', finished_at = now(),
      duration_ms = EXTRACT(epoch FROM (now() - started_at)) * 1000,
      edited_by = p_user_id, edited_at = now()
  WHERE id = p_scan_id;

  -- PERFORM discards a function's return value; valid in any PL/pgSQL
  -- block, procedure or function alike — no CALL (procedure-only) needed.
  PERFORM cqms.fn_finalize_run_status(p_run_id);
END;
$procedure$;
