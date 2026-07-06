-- Audit fields + functions-only access retrofit (ADR-018). From this
-- migration on, application code NEVER touches cqms tables directly:
-- every read goes through a view (v_* / the existing rollup views, all
-- filtering soft-deletes) and every write goes through a function or
-- procedure that takes the acting user as its FIRST parameter and calls
-- cqms.fn_assert_permission (ADR-017) before touching anything. The old
-- unauthenticated function signatures are DROPped — a stale caller fails
-- loudly instead of silently skipping the permission check.
--
-- Audit-depth convention (confirmed decision): mutable entities get the
-- full audit set; immutable fact rows (reports, scan_findings, run_files)
-- get created_by only — written once by ingestion, never edited, removed
-- via their parent scan's cascade.

-- ── A. Audit columns ─────────────────────────────────────────────────────

ALTER TABLE cqms.projects
  ADD COLUMN created_by uuid REFERENCES cqms.users(id),
  ADD COLUMN edited_by  uuid REFERENCES cqms.users(id),
  ADD COLUMN edited_at  timestamptz,
  ADD COLUMN enabled    boolean NOT NULL DEFAULT true,
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE cqms.scanners
  ADD COLUMN created_by uuid REFERENCES cqms.users(id),
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN edited_by  uuid REFERENCES cqms.users(id),
  ADD COLUMN edited_at  timestamptz,
  ADD COLUMN enabled    boolean NOT NULL DEFAULT true,
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE cqms.runs
  ADD COLUMN created_by uuid REFERENCES cqms.users(id),
  ADD COLUMN edited_by  uuid REFERENCES cqms.users(id),
  ADD COLUMN edited_at  timestamptz,
  ADD COLUMN enabled    boolean NOT NULL DEFAULT true,
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE cqms.scans
  ADD COLUMN created_by uuid REFERENCES cqms.users(id),
  ADD COLUMN edited_by  uuid REFERENCES cqms.users(id),
  ADD COLUMN edited_at  timestamptz,
  ADD COLUMN enabled    boolean NOT NULL DEFAULT true,
  ADD COLUMN deleted_at timestamptz;

-- Fact tables: created_by only.
ALTER TABLE cqms.reports       ADD COLUMN created_by uuid REFERENCES cqms.users(id);
ALTER TABLE cqms.scan_findings ADD COLUMN created_by uuid REFERENCES cqms.users(id);
ALTER TABLE cqms.run_files     ADD COLUMN created_by uuid REFERENCES cqms.users(id);

-- ── B. Read views ────────────────────────────────────────────────────────
-- SELECT * is expanded at CREATE VIEW time — any later ALTER TABLE ADD
-- COLUMN needs the affected view recreated to expose the new column.

CREATE VIEW cqms.v_projects AS
  SELECT * FROM cqms.projects WHERE deleted_at IS NULL;

CREATE VIEW cqms.v_scanners AS
  SELECT * FROM cqms.scanners WHERE deleted_at IS NULL;

CREATE VIEW cqms.v_runs AS
  SELECT * FROM cqms.runs WHERE deleted_at IS NULL;

CREATE VIEW cqms.v_scans AS
  SELECT * FROM cqms.scans WHERE deleted_at IS NULL;

CREATE VIEW cqms.v_reports AS
  SELECT * FROM cqms.reports;

CREATE VIEW cqms.v_scan_findings AS
  SELECT * FROM cqms.scan_findings;

-- Replaces getQueuedScans' hand-written 3-table join (the orchestrator's
-- queue read) — soft-deleted scans/projects/scanners drop out of the queue.
CREATE VIEW cqms.v_queued_scans AS
  SELECT
    s.id AS scan_id, s.run_id, s.project_id, s.scanner_id,
    s.scope_type, s.scope_value, s.created_at,
    sc.deterministic, sc.skill_path,
    p.local_path
  FROM cqms.scans s
  JOIN cqms.scanners sc ON sc.scanner_id = s.scanner_id
  JOIN cqms.projects p ON p.id = s.project_id
  WHERE s.status = 'queued'
    AND s.deleted_at IS NULL
    AND sc.deleted_at IS NULL
    AND p.deleted_at IS NULL;

-- Replaces getProjectRuns' hand-written rollup join — every run with its
-- own severity rollup (unlike project_run_summary's latest-run-only).
CREATE VIEW cqms.v_project_runs AS
  SELECT r.*,
         COALESCE(SUM(rep.high_count), 0)::int AS total_high,
         COALESCE(SUM(rep.medium_count), 0)::int AS total_medium
  FROM cqms.runs r
  LEFT JOIN cqms.scans s ON s.run_id = r.id AND s.deleted_at IS NULL
  LEFT JOIN cqms.reports rep ON rep.scan_id = s.id
  WHERE r.deleted_at IS NULL
  GROUP BY r.id;

-- Recreate the 0003/0006 rollup views with soft-delete filters.
DROP VIEW cqms.project_run_summary;
CREATE VIEW cqms.project_run_summary AS
  SELECT p.*, lr.run_id AS latest_run_id, lr.status AS latest_run_status,
         lr.total_high, lr.total_medium
  FROM cqms.projects p
  LEFT JOIN LATERAL (
    SELECT r.id AS run_id, r.status,
           COALESCE(SUM(rep.high_count), 0)::int AS total_high,
           COALESCE(SUM(rep.medium_count), 0)::int AS total_medium
    FROM cqms.runs r
    LEFT JOIN cqms.scans s ON s.run_id = r.id AND s.deleted_at IS NULL
    LEFT JOIN cqms.reports rep ON rep.scan_id = s.id
    WHERE r.project_id = p.id AND r.deleted_at IS NULL
    GROUP BY r.id, r.status, r.created_at
    ORDER BY r.created_at DESC
    LIMIT 1
  ) lr ON true
  WHERE p.deleted_at IS NULL;

DROP VIEW cqms.run_scan_summary;
CREATE VIEW cqms.run_scan_summary AS
  SELECT s.run_id, s.id AS scan_id, s.scanner_id, s.status,
         s.progress_message, s.error_message, s.duration_ms,
         s.started_at, s.finished_at,
         rep.blocker_count, rep.high_count, rep.medium_count,
         rep.low_count, rep.nit_count
  FROM cqms.scans s
  LEFT JOIN cqms.reports rep ON rep.scan_id = s.id
  WHERE s.deleted_at IS NULL;

DROP VIEW cqms.project_scanner_trend;
CREATE VIEW cqms.project_scanner_trend AS
  SELECT r.project_id, s.scanner_id, r.id AS run_id, r.created_at,
         rep.high_count, rep.medium_count,
         rep.high_count - lag(rep.high_count) OVER w AS high_count_delta,
         rep.medium_count - lag(rep.medium_count) OVER w AS medium_count_delta
  FROM cqms.runs r
  JOIN cqms.scans s ON s.run_id = r.id AND s.deleted_at IS NULL
  JOIN cqms.reports rep ON rep.scan_id = s.id
  WHERE r.deleted_at IS NULL
  WINDOW w AS (PARTITION BY r.project_id, s.scanner_id ORDER BY r.created_at);

-- ── C. Write functions — p_user_id first, fn_assert_permission first ─────

DROP FUNCTION cqms.fn_upsert_project(text, text);
CREATE FUNCTION cqms.fn_upsert_project(
  p_user_id uuid, p_name text, p_local_path text
) RETURNS uuid AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'create', 'project');
  INSERT INTO cqms.projects (name, local_path, created_by)
  VALUES (p_name, p_local_path, p_user_id)
  ON CONFLICT (local_path) DO UPDATE
    SET last_scanned_at = now(), edited_by = p_user_id, edited_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- update-by-id is now a function too (was a direct UPDATE in
-- updateProject.util.ts). Instance grants apply via p_project_id.
CREATE FUNCTION cqms.fn_update_project(
  p_user_id uuid, p_project_id uuid, p_name text, p_local_path text
) RETURNS void AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'project', p_project_id);
  UPDATE cqms.projects
  SET name = p_name, local_path = p_local_path,
      edited_by = p_user_id, edited_at = now()
  WHERE id = p_project_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- The execute-scan permission is asserted HERE (with the project as the
-- grantable resource — "user X may execute scans on project Y"), so both
-- run-creating paths (UI trigger + ad hoc CLI) get one consistent check.
DROP FUNCTION cqms.fn_create_run(uuid, text, jsonb, text, text, text);
CREATE FUNCTION cqms.fn_create_run(
  p_user_id uuid, p_project_id uuid, p_origin text, p_requested_scanners jsonb,
  p_triggered_by text, p_git_commit_sha text, p_git_branch text
) RETURNS uuid AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'execute', 'scan', p_project_id);
  INSERT INTO cqms.runs (project_id, origin, requested_scanners, triggered_by,
                         git_commit_sha, git_branch, status, started_at, created_by)
  VALUES (p_project_id, p_origin, p_requested_scanners, p_triggered_by,
          p_git_commit_sha, p_git_branch, 'running', now(), p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION cqms.fn_create_run_with_scans(uuid, text, jsonb, text, text, text, text, text);
CREATE FUNCTION cqms.fn_create_run_with_scans(
  p_user_id uuid, p_project_id uuid, p_origin text, p_requested_scanners jsonb,
  p_triggered_by text, p_git_commit_sha text, p_git_branch text,
  p_scope_type text, p_scope_value text
) RETURNS uuid AS $$
DECLARE v_run_id uuid;
BEGIN
  v_run_id := cqms.fn_create_run(p_user_id, p_project_id, p_origin,
                                 p_requested_scanners, p_triggered_by,
                                 p_git_commit_sha, p_git_branch);

  INSERT INTO cqms.scans (run_id, project_id, scanner_id, scope_type, scope_value, created_by)
  SELECT v_run_id, p_project_id, s.value, p_scope_type, p_scope_value, p_user_id
  FROM jsonb_array_elements_text(p_requested_scanners) AS s(value);

  PERFORM pg_notify('cqms_scan_queued', v_run_id::text);

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql;

-- The ad hoc interactive-session path's scan row (was a direct INSERT in
-- resolveScan.util.ts) — created already-running, since the skill has
-- already executed by the time ingestion happens.
CREATE FUNCTION cqms.fn_create_ad_hoc_scan(
  p_user_id uuid, p_run_id uuid, p_project_id uuid, p_scanner_id text,
  p_scope_type text, p_scope_value text
) RETURNS uuid AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'execute', 'scan', p_project_id);
  INSERT INTO cqms.scans (run_id, project_id, scanner_id, status, scope_type,
                          scope_value, started_at, created_by)
  VALUES (p_run_id, p_project_id, p_scanner_id, 'running', p_scope_type,
          p_scope_value, now(), p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION cqms.fn_mark_scan_running(
  p_user_id uuid, p_scan_id uuid
) RETURNS void AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);
  -- started_at is set here (not at scan creation): sp_ingest_scan_result's
  -- duration_ms is now() - started_at, and a scan can sit queued a while.
  UPDATE cqms.scans
  SET status = 'running', started_at = now(),
      edited_by = p_user_id, edited_at = now()
  WHERE id = p_scan_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION cqms.fn_mark_scan_failed(
  p_user_id uuid, p_scan_id uuid, p_run_id uuid, p_error_message text
) RETURNS void AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);
  UPDATE cqms.scans
  SET status = 'failed', error_message = p_error_message, finished_at = now(),
      duration_ms = EXTRACT(epoch FROM (now() - started_at)) * 1000,
      edited_by = p_user_id, edited_at = now()
  WHERE id = p_scan_id AND deleted_at IS NULL;
  PERFORM cqms.fn_finalize_run_status(p_run_id);
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION cqms.fn_update_scan_progress(
  p_user_id uuid, p_scan_id uuid, p_progress_message text
) RETURNS void AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);
  UPDATE cqms.scans
  SET progress_message = p_progress_message,
      edited_by = p_user_id, edited_at = now()
  WHERE id = p_scan_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Was a direct UPDATE in ingestReport.ts (raw_json/health_metrics are
-- deliberately not sp_ingest_scan_result parameters — see 0002).
CREATE FUNCTION cqms.fn_set_scan_raw_artifacts(
  p_user_id uuid, p_scan_id uuid, p_raw_json jsonb, p_health_metrics jsonb
) RETURNS void AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);
  UPDATE cqms.scans
  SET raw_json = p_raw_json, health_metrics = p_health_metrics,
      edited_by = p_user_id, edited_at = now()
  WHERE id = p_scan_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

DROP PROCEDURE cqms.sp_ingest_scan_result(uuid, uuid, text, jsonb, jsonb, jsonb, jsonb);
CREATE PROCEDURE cqms.sp_ingest_scan_result(
  p_user_id uuid, p_scan_id uuid, p_run_id uuid, p_report_markdown text,
  p_report_json jsonb, p_report_metadata jsonb, p_findings jsonb,
  p_file_inventory jsonb
) LANGUAGE plpgsql AS $$
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

  INSERT INTO cqms.scan_findings (scan_id, finding_id, rule_id, severity, confidence, location_path, location_hint, evidence_excerpt, why, fix, effort, defer_risk, verification_steps, tags, finding_kind, extra, created_by)
  SELECT p_scan_id, f.*, p_user_id FROM jsonb_to_recordset(p_findings) AS f(
    finding_id text, rule_id text, severity text, confidence text, location_path text, location_hint text,
    evidence_excerpt text, why text, fix text, effort text, defer_risk text, verification_steps jsonb,
    tags jsonb, finding_kind text, extra jsonb
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
$$;
