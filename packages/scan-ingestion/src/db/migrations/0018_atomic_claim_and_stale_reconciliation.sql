-- Atomic queue claim + stale-'running' reconciliation (ADR-026; closes the
-- two operational gaps ADR-015/ADR-021 documented as future work).
--
-- 1. fn_claim_queued_scan replaces fn_mark_scan_running. The old function
--    transitioned unconditionally, so exactly-once execution rested
--    entirely on there being a single orchestrator process — a duplicate
--    listener (it happened live during Phase 3) executed the same scan
--    twice. The claim's `status = 'queued'` predicate makes the row's own
--    status transition the arbiter: under READ COMMITTED a concurrent
--    claimer blocks on the row lock, re-evaluates the predicate against
--    the winner's committed 'running' value, matches nothing and gets
--    FALSE. The loser simply skips the scan.
--
-- 2. fn_fail_stale_running_scans: a scan whose orchestrator died mid-run
--    stayed 'running' forever — never re-queued, never failed, its run
--    never finalized. The orchestrator calls this ONCE at startup, before
--    it begins listening/claiming: at that moment every 'running' row is
--    necessarily stale (single active orchestrator is the deployment
--    model, ADR-015 — see ADR-026 for the multi-instance caveat). Failed
--    set-wise, then each affected run is finalized exactly like
--    fn_mark_scan_failed does for a single scan.
--
-- fn_mark_scan_running is DROPped (not kept as an alias) per ADR-018's
-- precedent: stale callers should fail loudly, not silently keep the racy
-- path alive.

CREATE FUNCTION cqms.fn_claim_queued_scan(p_user_id uuid, p_scan_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);
  -- started_at is set here (not at scan creation): sp_ingest_scan_result's
  -- duration_ms is now() - started_at, and a scan can sit queued a while.
  UPDATE cqms.scans
  SET status = 'running', started_at = now(),
      edited_by = p_user_id, edited_at = now()
  WHERE id = p_scan_id AND status = 'queued' AND deleted_at IS NULL;
  RETURN FOUND;
END;
$function$;

CREATE FUNCTION cqms.fn_fail_stale_running_scans(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  v_scan_count integer;
  v_run_ids uuid[];
BEGIN
  -- Type-wide assert (no per-instance grant applies to a set-wise sweep).
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan');

  WITH stale AS (
    UPDATE cqms.scans
    SET status = 'failed',
        error_message = 'Orchestrator restarted while this scan was running — re-trigger it.',
        finished_at = now(),
        duration_ms = EXTRACT(epoch FROM (now() - started_at)) * 1000,
        edited_by = p_user_id, edited_at = now()
    WHERE status = 'running' AND deleted_at IS NULL
    RETURNING id, run_id
  )
  SELECT count(*), array_agg(DISTINCT run_id)
  INTO v_scan_count, v_run_ids
  FROM stale;

  IF v_run_ids IS NOT NULL THEN
    PERFORM cqms.fn_finalize_run_status(run_id)
    FROM unnest(v_run_ids) AS run_id;
  END IF;

  RETURN v_scan_count;
END;
$function$;

DROP FUNCTION cqms.fn_mark_scan_running(uuid, uuid);
