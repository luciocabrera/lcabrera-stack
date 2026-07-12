-- ADR-028 (CodePulse Phase 1): snapshot ingestion foundation.
-- Projects stop pointing at server-local checkouts (local_path) and start
-- pointing at platform-managed code snapshots synced from the developer's
-- machine (PRD_V2 §3/§4). Clean break: no data migration — a dev database
-- is re-provisioned, existing path-registered rows are dropped with the
-- column's dependents.

-- ── A. Snapshot fact table ────────────────────────────────────────────────
-- Rows are historical sync metadata (who synced what, when, from where);
-- only the LATEST snapshot's files stay on disk — the app layer deletes
-- the replaced snapshot's storage directory (latest-wins, PRD_V2 §3).
-- uuidv7() is PG-18 core (0001 confirmed this instance is PG 18) — new
-- tables get v7 defaults; swapping the older tables' gen_random_uuid()
-- defaults stays deferred (audit report §4.9).
CREATE TABLE cqms.project_snapshots (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  project_id    uuid NOT NULL REFERENCES cqms.projects(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,          -- server dir holding the unpacked tree
  archive_name  text NOT NULL,          -- original upload filename (metadata only)
  size_bytes    bigint NOT NULL,
  file_count    integer NOT NULL,
  source_label  text NOT NULL,          -- 'browser-upload' today; 'cli:<host>' next increment
  created_by    uuid REFERENCES cqms.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_snapshots_project
  ON cqms.project_snapshots (project_id, created_at DESC);

-- ── B. projects: snapshot reference in, local_path out ───────────────────
-- Dependent views must go first (Postgres refuses DROP COLUMN under them);
-- all are recreated in section D. The two llm_usage views (0019) sit on
-- top of v_projects, so they go first and come back verbatim — they only
-- read p.name, which the snapshot-model v_projects still exposes.
DROP VIEW llm_usage.v_capped_llm_usage_attempts;
DROP VIEW llm_usage.v_project_llm_cost;
DROP VIEW cqms.v_queued_scans;
DROP VIEW cqms.project_run_summary;
DROP VIEW cqms.v_projects;

ALTER TABLE cqms.projects
  ADD COLUMN latest_snapshot_id uuid REFERENCES cqms.project_snapshots(id),
  DROP COLUMN local_path;

-- ── C. Write functions ────────────────────────────────────────────────────

-- Registration no longer carries a path, and with the local_path unique
-- key gone there is nothing to upsert against — plain INSERT.
DROP FUNCTION cqms.fn_upsert_project(uuid, text, text);
CREATE FUNCTION cqms.fn_register_project(p_user_id uuid, p_name text)
RETURNS uuid AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'create', 'project');
  INSERT INTO cqms.projects (name, created_by)
  VALUES (p_name, p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION cqms.fn_update_project(uuid, uuid, text, text);
CREATE FUNCTION cqms.fn_update_project(
  p_user_id uuid, p_project_id uuid, p_name text
) RETURNS void AS $$
BEGIN
  PERFORM cqms.fn_assert_update_permission(p_user_id, 'project', p_project_id);
  UPDATE cqms.projects
  SET name = p_name, edited_by = p_user_id, edited_at = now()
  WHERE id = p_project_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- One call records the sync and repoints the project: inserts the snapshot
-- row, swaps latest_snapshot_id, and hands the caller the REPLACED
-- snapshot's storage path so the app layer can delete that directory
-- (the DB owns the pointer swap; the filesystem cleanup is app-side).
-- Syncing code mutates the project, so it asserts the same instance-level
-- 'update project' permission as fn_update_project.
CREATE FUNCTION cqms.fn_set_project_snapshot(
  p_user_id uuid, p_project_id uuid, p_storage_path text, p_archive_name text,
  p_size_bytes bigint, p_file_count integer, p_source_label text
) RETURNS TABLE (snapshot_id uuid, replaced_storage_path text) AS $$
DECLARE
  v_snapshot_id uuid;
  v_replaced text;
BEGIN
  PERFORM cqms.fn_assert_update_permission(p_user_id, 'project', p_project_id);

  SELECT ps.storage_path INTO v_replaced
  FROM cqms.projects p
  JOIN cqms.project_snapshots ps ON ps.id = p.latest_snapshot_id
  WHERE p.id = p_project_id;

  INSERT INTO cqms.project_snapshots
    (project_id, storage_path, archive_name, size_bytes, file_count, source_label, created_by)
  VALUES
    (p_project_id, p_storage_path, p_archive_name, p_size_bytes, p_file_count, p_source_label, p_user_id)
  RETURNING id INTO v_snapshot_id;

  UPDATE cqms.projects
  SET latest_snapshot_id = v_snapshot_id, edited_by = p_user_id, edited_at = now()
  WHERE id = p_project_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found.';
  END IF;

  RETURN QUERY SELECT v_snapshot_id, v_replaced;
END;
$$ LANGUAGE plpgsql;

-- "Trigger Scan always runs against the latest snapshot; triggering with
-- no snapshot is an error" (PRD_V2 §3). The check lives on the UI trigger
-- entry point, NOT inside fn_create_run: the ad-hoc CLI ingestion path
-- (evidence import for runs executed elsewhere) legitimately has no
-- snapshot. Same ERRCODE convention as 0021's active-run guard so the
-- action layer surfaces both rejections the same way.
CREATE OR REPLACE FUNCTION cqms.fn_create_run_with_scoped_scans(
  p_user_id uuid, p_project_id uuid, p_origin text, p_requested_scanners jsonb,
  p_triggered_by text, p_git_commit_sha text, p_git_branch text,
  p_scopes jsonb
) RETURNS uuid AS $$
DECLARE v_run_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cqms.projects
    WHERE id = p_project_id AND latest_snapshot_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No code snapshot has been synced for this project. Upload a snapshot before triggering a scan.'
      USING ERRCODE = '55000'; -- object_not_in_prerequisite_state
  END IF;

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

-- ── D. Views recreated on the snapshot model ─────────────────────────────

CREATE VIEW cqms.v_projects AS
  SELECT p.id, p.name, p.default_branch, p.created_at, p.last_scanned_at,
         p.created_by, p.edited_by, p.edited_at, p.enabled, p.deleted_at,
         p.latest_snapshot_id,
         ps.storage_path AS snapshot_path,
         ps.created_at   AS synced_at,
         ps.created_by   AS synced_by,
         ps.source_label AS sync_source
  FROM cqms.projects p
  LEFT JOIN cqms.project_snapshots ps ON ps.id = p.latest_snapshot_id
  WHERE p.deleted_at IS NULL;

-- Rebuilt ON TOP of v_projects (0009 built it on the base table): the
-- soft-delete filter and the snapshot columns come along for free.
CREATE VIEW cqms.project_run_summary AS
  SELECT v.*, lr.run_id AS latest_run_id, lr.status AS latest_run_status,
         lr.total_high, lr.total_medium
  FROM cqms.v_projects v
  LEFT JOIN LATERAL (
    SELECT r.id AS run_id, r.status,
           COALESCE(SUM(rep.high_count), 0)::int AS total_high,
           COALESCE(SUM(rep.medium_count), 0)::int AS total_medium
    FROM cqms.runs r
    LEFT JOIN cqms.scans s ON s.run_id = r.id AND s.deleted_at IS NULL
    LEFT JOIN cqms.reports rep ON rep.scan_id = s.id
    WHERE r.project_id = v.id AND r.deleted_at IS NULL
    GROUP BY r.id, r.status, r.created_at
    ORDER BY r.created_at DESC
    LIMIT 1
  ) lr ON true;

-- The orchestrator's scan target is now the latest snapshot's storage
-- directory — never a user-named server path. INNER JOIN on the snapshot:
-- a queued scan whose project somehow lost its snapshot drops out of the
-- queue rather than dispatching with a NULL target.
CREATE VIEW cqms.v_queued_scans AS
  SELECT
    s.id AS scan_id, s.run_id, s.project_id, s.scanner_id,
    s.scope_type, s.scope_value, s.created_at,
    sc.deterministic, sc.skill_path,
    ps.storage_path AS snapshot_path
  FROM cqms.scans s
  JOIN cqms.scanners sc ON sc.scanner_id = s.scanner_id
  JOIN cqms.projects p ON p.id = s.project_id
  JOIN cqms.project_snapshots ps ON ps.id = p.latest_snapshot_id
  WHERE s.status = 'queued'
    AND s.deleted_at IS NULL
    AND sc.deleted_at IS NULL
    AND p.deleted_at IS NULL;

-- llm_usage views recreated verbatim from 0019 — dropped in section B only
-- because they depend on v_projects, not because their shape changed.
CREATE VIEW llm_usage.v_project_llm_cost AS
  SELECT
    u.project_id, p.name AS project_name,
    (count(u.id) FILTER (WHERE u.outcome <> 'capped'))::int AS call_count,
    (count(u.id) FILTER (WHERE u.outcome = 'capped'))::int AS capped_count,
    coalesce(sum(u.total_cost_usd) FILTER (WHERE u.outcome <> 'capped'), 0) AS total_cost_usd
  FROM llm_usage.scan_llm_usage u
  JOIN cqms.v_projects p ON p.id = u.project_id
  GROUP BY u.project_id, p.name;

CREATE VIEW llm_usage.v_capped_llm_usage_attempts AS
  SELECT u.id, u.scan_id, u.run_id, u.project_id, p.name AS project_name,
         u.scanner_id, s.display_name AS scanner_display_name,
         u.triggered_by, u.error_message, u.created_at
  FROM llm_usage.scan_llm_usage u
  JOIN cqms.v_projects p ON p.id = u.project_id
  JOIN cqms.v_scanners s ON s.scanner_id = u.scanner_id
  WHERE u.outcome = 'capped';
