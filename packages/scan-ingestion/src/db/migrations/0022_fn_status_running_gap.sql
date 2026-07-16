-- Same environment-drift class as 0020: this exact function is already
-- defined in the current content of 0009_audit_and_functions.sql ("Shared
-- by cqms.runs.status and cqms.scans.status" — used by fn_create_run and
-- fn_claim_queued_scan/fn_fail_stale_running_scans), but this dev
-- environment never actually got it created. Re-declaring it here
-- (idempotent-safe via CREATE OR REPLACE) brings it back in sync.
CREATE OR REPLACE FUNCTION cqms.fn_status_running() RETURNS text AS $$
  SELECT 'running';
$$ LANGUAGE sql IMMUTABLE;
