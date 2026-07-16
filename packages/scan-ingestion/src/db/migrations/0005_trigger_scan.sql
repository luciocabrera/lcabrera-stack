-- Backs the UI trigger-scan action (Implementation Plan step 8): creates a
-- run plus one 'queued' scan row per requested scanner, in one statement —
-- matching the existing bulk-insert convention (sp_ingest_scan_result) so
-- the multi-row write lives in the DB, not as N individual TS-issued
-- INSERTs. Composes fn_create_run rather than duplicating it.
CREATE FUNCTION cqms.fn_create_run_with_scans(
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

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql;
