-- ADR-034: pin a run to the snapshot it was triggered on; retain that snapshot
-- until the pinning run finishes, then collect it. Fixes STATUS.md §3.4, a
-- two-part bug that a foreign key closes for free:
--   (1) v_queued_scans resolved the scan target through
--       projects.latest_snapshot_id — whatever is latest AT CLAIM TIME — so a sync
--       between trigger and claim silently changed the analyzed code.
--   (2) fn_set_project_snapshot unconditionally returned the replaced snapshot's
--       storage_path, which saveProjectSnapshot rmSync'd — deleting the tree out
--       from under a running scan.
-- The DB owns the pointer; the app owns the filesystem (ADR-028 split preserved).

-- ── 1. The pin ──────────────────────────────────────────────────────────────
-- ON DELETE SET NULL, deliberately (not RESTRICT): run history is permanent
-- (PRD_V2 §3), so RESTRICT would make every snapshot undeletable forever — the
-- exact thing §3 forbids. A NULL snapshot_id on a finished run reads as "code
-- already collected", the normal end state.
ALTER TABLE cqms.runs
  ADD COLUMN snapshot_id uuid REFERENCES cqms.project_snapshots(id) ON DELETE SET NULL;

CREATE INDEX runs_snapshot_active_idx
  ON cqms.runs (snapshot_id)
  WHERE snapshot_id IS NOT NULL;

-- ── 2. Capture the pin at run creation ──────────────────────────────────────
-- fn_create_run is the single choke point both trigger paths
-- (fn_create_run_with_scans, fn_create_run_with_scoped_scans) call, and it holds
-- the §8 per-project advisory lock (0021). Capturing the snapshot HERE — in the
-- same transaction as the lock and the admission check — means the pin and the
-- admission decision cannot disagree, and both trigger paths get it for free.
-- The ad-hoc CLI path (no snapshot) pins NULL, which is correct.
CREATE OR REPLACE FUNCTION cqms.fn_create_run(
  p_user_id uuid, p_project_id uuid, p_origin text, p_requested_scanners jsonb,
  p_triggered_by text, p_git_commit_sha text, p_git_branch text
) RETURNS uuid AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'execute', 'scan', p_project_id);

  PERFORM pg_advisory_xact_lock(hashtextextended(p_project_id::text, 0));

  IF EXISTS (
    SELECT 1 FROM cqms.runs
    WHERE project_id = p_project_id AND status IN ('queued', 'running')
  ) THEN
    RAISE EXCEPTION 'A scan is already running for this project. Wait for it to finish before starting another.'
      USING ERRCODE = '55000'; -- object_not_in_prerequisite_state
  END IF;

  INSERT INTO cqms.runs (project_id, origin, requested_scanners, triggered_by,
                         git_commit_sha, git_branch, status, started_at, created_by,
                         snapshot_id)
  VALUES (p_project_id, p_origin, p_requested_scanners, p_triggered_by,
          p_git_commit_sha, p_git_branch, cqms.fn_status_running(), now(), p_user_id,
          (SELECT latest_snapshot_id FROM cqms.projects WHERE id = p_project_id))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ── 3. Resolve the scan target through the pin, never through latest ────────
-- The only change from 0027's view: join cqms.runs and resolve the snapshot via
-- runs.snapshot_id instead of projects.latest_snapshot_id. A run analyzes the
-- code it was triggered on, whatever syncs land afterwards. INNER JOIN on the
-- run's snapshot keeps the guarantee that a scan with no resolvable target drops
-- out of the queue rather than dispatching a NULL path.
DROP VIEW cqms.v_queued_scans;
CREATE VIEW cqms.v_queued_scans AS
  SELECT
    s.id AS scan_id, s.run_id, s.project_id, s.scanner_id,
    s.scope_type, s.scope_value, s.created_at,
    sc.deterministic, sc.skill_path,
    ps.storage_path AS snapshot_path
  FROM cqms.scans s
  JOIN cqms.scanners sc ON sc.scanner_id = s.scanner_id
  JOIN cqms.runs r ON r.id = s.run_id
  JOIN cqms.project_snapshots ps ON ps.id = r.snapshot_id
  JOIN cqms.projects p ON p.id = s.project_id
  WHERE s.status = 'queued'
    AND s.deleted_at IS NULL
    AND sc.deleted_at IS NULL
    AND p.deleted_at IS NULL;

-- ── 4. Retain a snapshot that an active run still pins ──────────────────────
-- fn_set_project_snapshot returns the replaced path ONLY when nothing active
-- pins it; otherwise NULL, so saveProjectSnapshot's rmSync is skipped and the
-- bytes survive the pointer swap. The sync itself is never blocked and
-- latest-wins is preserved exactly — the new snapshot becomes latest
-- immediately; only the outgoing bytes linger, and only while a run reads them.
CREATE OR REPLACE FUNCTION cqms.fn_set_project_snapshot(
  p_user_id uuid, p_project_id uuid, p_storage_path text, p_archive_name text,
  p_size_bytes bigint, p_file_count integer, p_source_label text
) RETURNS TABLE (snapshot_id uuid, replaced_storage_path text) AS $$
DECLARE
  v_snapshot_id uuid;
  v_replaced_id uuid;
  v_replaced_path text;
BEGIN
  PERFORM cqms.fn_assert_update_permission(p_user_id, 'project', p_project_id);

  SELECT p.latest_snapshot_id, ps.storage_path
    INTO v_replaced_id, v_replaced_path
  FROM cqms.projects p
  LEFT JOIN cqms.project_snapshots ps ON ps.id = p.latest_snapshot_id
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

  -- Retain (return NULL) while a queued/running run still pins the replaced
  -- snapshot; that run collects it on finalize (§5). §8's one-active-run-per-
  -- project lock keeps this a single-row existence check, not a refcount.
  -- `r.snapshot_id` is qualified: an unqualified `snapshot_id` would collide
  -- with this function's RETURNS TABLE OUT column of the same name (ambiguous).
  IF v_replaced_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM cqms.runs r
    WHERE r.snapshot_id = v_replaced_id AND r.status IN ('queued', 'running')
  ) THEN
    v_replaced_path := NULL;
  END IF;

  RETURN QUERY SELECT v_snapshot_id, v_replaced_path;
END;
$$ LANGUAGE plpgsql;

-- ── 5. Collect the pinned snapshot once its run has finished ────────────────
-- fn_finalize_run_status (0002) is deliberately left untouched — it stays a
-- LANGUAGE sql function RETURNING void, called via PERFORM inside
-- sp_ingest_scan_result, so nothing about the run roll-up changes. Collection is
-- a SEPARATE, explicit step the orchestrator calls after each scan finishes
-- (ingestReport / markScanFailed both finalize the run DB-side first): the DB
-- owns the pointer delete, the app owns the rmSync (ADR-028 split).
--
-- Returns the collectable storage_path and deletes the snapshot row ONLY when
-- the run has terminated, it pinned a snapshot, that snapshot is no longer the
-- project's latest, and no OTHER queued/running run pins it. Otherwise NULL —
-- so it is safe to call after every scan, terminal or not. §8's one-active-run-
-- per-project lock keeps the "anyone else reading it?" check a single row. The
-- FK SET-NULLs every finished run that pinned the deleted snapshot → "collected".
-- ADR-026's stale-run sweep terminates a crashed run, so its snapshot becomes
-- collectable through this same call on the next orchestrator pass — no orphan
-- reaper, at most one leaked snapshot per crash.
CREATE FUNCTION cqms.fn_collect_finished_run_snapshot(p_run_id uuid)
RETURNS text AS $$
DECLARE
  v_project_id uuid;
  v_snapshot_id uuid;
  v_status text;
  v_collect_path text;
BEGIN
  SELECT project_id, snapshot_id, status
    INTO v_project_id, v_snapshot_id, v_status
  FROM cqms.runs
  WHERE id = p_run_id;

  IF v_snapshot_id IS NULL
     OR v_status NOT IN ('succeeded','failed','partially_failed','canceled') THEN
    RETURN NULL;
  END IF;

  SELECT ps.storage_path INTO v_collect_path
  FROM cqms.project_snapshots ps
  WHERE ps.id = v_snapshot_id
    AND ps.id IS DISTINCT FROM (SELECT latest_snapshot_id FROM cqms.projects WHERE id = v_project_id)
    AND NOT EXISTS (
      SELECT 1 FROM cqms.runs
      WHERE snapshot_id = ps.id AND id <> p_run_id AND status IN ('queued','running')
    );

  IF v_collect_path IS NOT NULL THEN
    DELETE FROM cqms.project_snapshots WHERE id = v_snapshot_id;
  END IF;

  RETURN v_collect_path;
END;
$$ LANGUAGE plpgsql;
