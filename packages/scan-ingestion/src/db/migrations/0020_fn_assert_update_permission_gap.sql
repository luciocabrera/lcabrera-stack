-- Environment-drift fix, discovered while verifying migration 0019: this
-- exact function is already defined in the current content of
-- 0009_audit_and_functions.sql (used by fn_mark_scan_failed and
-- fn_update_scan_progress), but some already-migrated environments never
-- actually got it created — CREATE FUNCTION for a PL/pgSQL body doesn't
-- validate the functions it calls, so fn_mark_scan_failed/
-- fn_update_scan_progress silently exist but fail at call time in any
-- environment missing this helper. Re-declaring it here (idempotent-safe
-- via CREATE OR REPLACE) brings any such environment back in sync without
-- editing an already-applied migration file.
CREATE OR REPLACE FUNCTION cqms.fn_assert_update_permission(
  p_user_id uuid, p_resource_type text, p_resource_id uuid DEFAULT NULL
) RETURNS void AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', p_resource_type, p_resource_id);
END;
$$ LANGUAGE plpgsql;
