-- Backs the standalone apps/scan-orchestrator process (Implementation Plan
-- step 9, TECH_SPEC §2.7): fn_create_run_with_scans is the one and only
-- place a run/scan gets created with status='queued', so a NOTIFY here
-- covers both the UI trigger-scan action and any future caller — no
-- application code needs to remember to signal the orchestrator itself.
-- NOTIFY is fire-and-forget, not durable (dropped if nobody is listening
-- when it fires) — the orchestrator's own reconciliation poll is the
-- correctness backstop for that gap, not this NOTIFY.
CREATE OR REPLACE FUNCTION cqms.fn_create_run_with_scans(
  p_project_id uuid, p_origin text, p_requested_scanners jsonb,
  p_triggered_by text, p_git_commit_sha text, p_git_branch text,
  p_scope_type text, p_scope_value text
) RETURNS uuid AS $$
DECLARE
  v_run_id uuid;
BEGIN
  v_run_id := cqms.fn_create_run(p_project_id, p_origin, p_requested_scanners, p_triggered_by, p_git_commit_sha, p_git_branch);

  INSERT INTO cqms.scans (run_id, project_id, scanner_id, scope_type, scope_value)
  SELECT v_run_id, p_project_id, s.value, p_scope_type, p_scope_value
  FROM jsonb_array_elements_text(p_requested_scanners) AS s(value);

  PERFORM pg_notify('cqms_scan_queued', v_run_id::text);

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql;
