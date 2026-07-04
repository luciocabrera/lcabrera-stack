-- Functions/procedures live in the `cqms` schema, not `public`, and every
-- reference inside them is schema-qualified — none of this relies on the
-- calling session's search_path.

-- Match-or-create a project by canonicalized local_path. Backs both the
-- CLI's ad hoc interactive-session path and the UI's new-project action.
CREATE FUNCTION cqms.fn_upsert_project(p_name text, p_local_path text)
RETURNS uuid AS $$
  INSERT INTO cqms.projects (name, local_path)
  VALUES (p_name, p_local_path)
  ON CONFLICT (local_path) DO UPDATE SET last_scanned_at = now()
  RETURNING id;
$$ LANGUAGE sql;

-- Creates a run row; used by both the UI trigger-scan action and the CLI's
-- auto-create-a-run-for-one-ad-hoc-scan path.
CREATE FUNCTION cqms.fn_create_run(
  p_project_id uuid, p_origin text, p_requested_scanners jsonb,
  p_triggered_by text, p_git_commit_sha text, p_git_branch text
) RETURNS uuid AS $$
  INSERT INTO cqms.runs (project_id, origin, requested_scanners, triggered_by, git_commit_sha, git_branch, status, started_at)
  VALUES (p_project_id, p_origin, p_requested_scanners, p_triggered_by, p_git_commit_sha, p_git_branch, 'running', now())
  RETURNING id;
$$ LANGUAGE sql;

-- Rolls sibling scans' statuses up into the parent run once all
-- requested_scanners have reached a terminal state.
CREATE FUNCTION cqms.fn_finalize_run_status(p_run_id uuid) RETURNS void AS $$
  UPDATE cqms.runs SET
    status = CASE
      WHEN NOT EXISTS (SELECT 1 FROM cqms.scans WHERE run_id = p_run_id AND status NOT IN ('succeeded','failed','canceled'))
        THEN (CASE
          WHEN EXISTS (SELECT 1 FROM cqms.scans WHERE run_id = p_run_id AND status = 'failed')
           AND EXISTS (SELECT 1 FROM cqms.scans WHERE run_id = p_run_id AND status = 'succeeded') THEN 'partially_failed'
          WHEN EXISTS (SELECT 1 FROM cqms.scans WHERE run_id = p_run_id AND status = 'failed') THEN 'failed'
          ELSE 'succeeded' END)
      ELSE 'running'
    END,
    finished_at = CASE WHEN NOT EXISTS (SELECT 1 FROM cqms.scans WHERE run_id = p_run_id AND status NOT IN ('succeeded','failed','canceled')) THEN now() ELSE finished_at END,
    updated_at = now()
  WHERE id = p_run_id;
$$ LANGUAGE sql;

-- Bulk-inserts findings and (for whole-project scopes) file inventory via
-- jsonb_to_recordset, rather than N individual parameterized INSERTs issued
-- from TypeScript. p_findings / p_file_inventory are JSON arrays matching
-- scan_findings / run_files' shapes (minus generated columns).
CREATE PROCEDURE cqms.sp_ingest_scan_result(
  p_scan_id uuid, p_run_id uuid, p_report_markdown text, p_report_json jsonb,
  p_report_metadata jsonb, -- { report_id, generated_at, files_analyzed, blocker_count, high_count, medium_count, low_count, nit_count, top_risk }
  p_findings jsonb,        -- readonly ScanFindingInput[]
  p_file_inventory jsonb   -- readonly RunFileInput[] | null (null for diff-scope scans)
) LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO cqms.reports (scan_id, report_id, generated_at, report_markdown, report_json, files_analyzed, blocker_count, high_count, medium_count, low_count, nit_count, top_risk)
  SELECT p_scan_id, r.report_id, r.generated_at, p_report_markdown, p_report_json,
         r.files_analyzed, r.blocker_count, r.high_count, r.medium_count, r.low_count, r.nit_count, r.top_risk
  FROM jsonb_to_record(p_report_metadata) AS r(
    report_id text, generated_at timestamptz, files_analyzed integer,
    blocker_count integer, high_count integer, medium_count integer,
    low_count integer, nit_count integer, top_risk text
  );

  INSERT INTO cqms.scan_findings (scan_id, finding_id, rule_id, severity, confidence, location_path, location_hint, evidence_excerpt, why, fix, effort, defer_risk, verification_steps, tags, finding_kind, extra)
  SELECT p_scan_id, f.* FROM jsonb_to_recordset(p_findings) AS f(
    finding_id text, rule_id text, severity text, confidence text, location_path text, location_hint text,
    evidence_excerpt text, why text, fix text, effort text, defer_risk text, verification_steps jsonb,
    tags jsonb, finding_kind text, extra jsonb
  );

  IF p_file_inventory IS NOT NULL THEN
    INSERT INTO cqms.run_files (run_id, file_path, file_type_category, extension, nested_level, line_count)
    SELECT p_run_id, f.* FROM jsonb_to_recordset(p_file_inventory) AS f(
      file_path text, file_type_category text, extension text, nested_level integer, line_count integer
    )
    ON CONFLICT (run_id, file_path) DO NOTHING;
  END IF;

  UPDATE cqms.scans SET status = 'succeeded', finished_at = now(), duration_ms = EXTRACT(epoch FROM (now() - started_at)) * 1000
  WHERE id = p_scan_id;

  -- PERFORM discards a function's return value; valid in any PL/pgSQL
  -- block, procedure or function alike — no CALL (procedure-only) needed.
  PERFORM cqms.fn_finalize_run_status(p_run_id);
END;
$$;
