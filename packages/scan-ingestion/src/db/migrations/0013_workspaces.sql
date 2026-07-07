-- Workspace discovery + scoped trigger-scan (ADR-021, Phase-3 Step 7).
-- A monorepo project is registered ONCE at its root; discovery (TS side —
-- pnpm-workspace.yaml / package.json workspaces) fills
-- cqms.project_workspaces, and trigger-scan can then fan a run out as
-- scanners × scopes. Workspace attribution of findings is a VIEW
-- (longest-prefix match over project-root-relative paths), never a stored
-- column — the workspace list can be re-discovered at any time and
-- attribution must follow, not fossilize.

-- Derived data, replaced wholesale on every refresh → fact-table audit
-- depth (created_by/created_at only, ADR-018).
CREATE TABLE cqms.project_workspaces (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES cqms.projects(id) ON DELETE CASCADE,
  workspace_path text NOT NULL,   -- project-root-relative, no trailing slash
  workspace_name text,            -- the workspace's package.json "name", when readable
  created_by     uuid REFERENCES cqms.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, workspace_path)
);
CREATE INDEX project_workspaces_project_idx ON cqms.project_workspaces (project_id);

CREATE VIEW cqms.v_project_workspaces AS
  SELECT * FROM cqms.project_workspaces;

-- DELETE-then-INSERT wholesale replace — discovery output is a snapshot,
-- not an entity to be edited row by row. Idempotent by construction.
CREATE FUNCTION cqms.fn_replace_project_workspaces(
  p_user_id uuid, p_project_id uuid, p_workspaces jsonb
) RETURNS void AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'project', p_project_id);

  DELETE FROM cqms.project_workspaces WHERE project_id = p_project_id;
  INSERT INTO cqms.project_workspaces (project_id, workspace_path, workspace_name, created_by)
  SELECT p_project_id, w.workspace_path, w.workspace_name, p_user_id
  FROM jsonb_to_recordset(coalesce(p_workspaces, '[]'::jsonb)) AS w(
    workspace_path text, workspace_name text);
END;
$$ LANGUAGE plpgsql;

-- Scanners × scopes fan-out. p_scopes: [{scope_type, scope_value}, ...] —
-- the whole-repo case is a single {'repo','.'} entry, so
-- fn_create_run_with_scans' single-scope behavior is a strict subset (it
-- stays in place for existing callers/tests). Same pg_notify contract:
-- one notification per run, the orchestrator drains every queued scan.
CREATE FUNCTION cqms.fn_create_run_with_scoped_scans(
  p_user_id uuid, p_project_id uuid, p_origin text, p_requested_scanners jsonb,
  p_triggered_by text, p_git_commit_sha text, p_git_branch text,
  p_scopes jsonb
) RETURNS uuid AS $$
DECLARE v_run_id uuid;
BEGIN
  v_run_id := cqms.fn_create_run(p_user_id, p_project_id, p_origin,
                                 p_requested_scanners, p_triggered_by,
                                 p_git_commit_sha, p_git_branch);

  INSERT INTO cqms.scans (run_id, project_id, scanner_id, scope_type, scope_value, created_by)
  SELECT v_run_id, p_project_id, s.value, sc.scope_type, sc.scope_value, p_user_id
  FROM jsonb_array_elements_text(p_requested_scanners) AS s(value)
  CROSS JOIN jsonb_to_recordset(p_scopes) AS sc(scope_type text, scope_value text);

  PERFORM pg_notify('cqms_scan_queued', v_run_id::text);

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql;

-- ── Workspace attribution views ──────────────────────────────────────────
-- Longest-prefix match: a finding at packages/ui/sub/x.ts belongs to
-- workspace packages/ui/sub when both packages/ui and packages/ui/sub are
-- workspaces. Rows with no matching workspace keep NULL workspace columns
-- (the "repo root / unattributed" bucket — a real signal, not an error).
-- Built on the soft-delete-filtering v_* views. All detail-table file
-- paths are project-root-relative (ADR-019's contract), which is what
-- makes a plain prefix LIKE correct here.

CREATE VIEW cqms.scan_finding_workspaces AS
  SELECT f.id AS scan_finding_id, f.scan_id, s.project_id, f.location_path,
         w.workspace_path, w.workspace_name
  FROM cqms.v_scan_findings f
  JOIN cqms.v_scans s ON s.id = f.scan_id
  LEFT JOIN LATERAL (
    SELECT pw.workspace_path, pw.workspace_name
    FROM cqms.project_workspaces pw
    WHERE pw.project_id = s.project_id
      AND f.location_path LIKE pw.workspace_path || '/%'
    ORDER BY length(pw.workspace_path) DESC
    LIMIT 1
  ) w ON true;

CREATE VIEW cqms.fallow_file_score_workspaces AS
  SELECT fs.id AS fallow_file_score_id, fs.scan_id, s.project_id, fs.file_path,
         w.workspace_path, w.workspace_name
  FROM cqms.v_fallow_file_scores fs
  JOIN cqms.v_scans s ON s.id = fs.scan_id
  LEFT JOIN LATERAL (
    SELECT pw.workspace_path, pw.workspace_name
    FROM cqms.project_workspaces pw
    WHERE pw.project_id = s.project_id
      AND fs.file_path LIKE pw.workspace_path || '/%'
    ORDER BY length(pw.workspace_path) DESC
    LIMIT 1
  ) w ON true;

CREATE VIEW cqms.lint_violation_workspaces AS
  SELECT lv.id AS lint_violation_id, lv.scan_id, s.project_id, lv.file_path,
         lv.source, lv.rule_id, lv.suppressed,
         w.workspace_path, w.workspace_name
  FROM cqms.v_lint_violations lv
  JOIN cqms.v_scans s ON s.id = lv.scan_id
  LEFT JOIN LATERAL (
    SELECT pw.workspace_path, pw.workspace_name
    FROM cqms.project_workspaces pw
    WHERE pw.project_id = s.project_id
      AND lv.file_path LIKE pw.workspace_path || '/%'
    ORDER BY length(pw.workspace_path) DESC
    LIMIT 1
  ) w ON true;
