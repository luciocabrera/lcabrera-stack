-- Second guardrail from the Claude API cost/logging incident: a project
-- must not have more than one run in flight at a time. Both trigger paths
-- (fn_create_run_with_scans, fn_create_run_with_scoped_scans) call
-- fn_create_run first, and it already sets status='running' the instant
-- the row is inserted (cqms.fn_status_running()) — so this is the single
-- choke point to guard, same as runSkillAgent.ts was for the API-call side.
-- Same signature as the existing function, so CREATE OR REPLACE is enough.
CREATE OR REPLACE FUNCTION cqms.fn_create_run(
  p_user_id uuid, p_project_id uuid, p_origin text, p_requested_scanners jsonb,
  p_triggered_by text, p_git_commit_sha text, p_git_branch text
) RETURNS uuid AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'execute', 'scan', p_project_id);

  -- Serializes concurrent trigger-scan submissions for the same project
  -- (a double-click, two open tabs) so the existence check below can't
  -- race two callers past it before either commits its INSERT. Held for
  -- the transaction, released automatically at commit/rollback.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_project_id::text, 0));

  IF EXISTS (
    SELECT 1 FROM cqms.runs
    WHERE project_id = p_project_id AND status IN ('queued', 'running')
  ) THEN
    RAISE EXCEPTION 'A scan is already running for this project. Wait for it to finish before starting another.'
      USING ERRCODE = '55000'; -- object_not_in_prerequisite_state
  END IF;

  INSERT INTO cqms.runs (project_id, origin, requested_scanners, triggered_by,
                         git_commit_sha, git_branch, status, started_at, created_by)
  VALUES (p_project_id, p_origin, p_requested_scanners, p_triggered_by,
          p_git_commit_sha, p_git_branch, cqms.fn_status_running(), now(), p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
