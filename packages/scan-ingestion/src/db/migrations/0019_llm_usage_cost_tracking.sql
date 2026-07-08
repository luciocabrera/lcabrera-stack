-- Claude API cost/logging incident: apps/scan-orchestrator's runSkillAgent()
-- already computes totalCostUsd/numTurns per run (Agent SDK result message)
-- but nothing ever persisted it — 150+ real API calls happened with zero
-- cost visibility. New schema (separate from cqms, per the incident's
-- decision) so this doesn't pollute the scan-domain schema: one fact table
-- (one row per attempt — a real run OR a budget-cap skip that never called
-- the Agent SDK at all), one write function, five read views.
--
-- Explicit column lists throughout, never `SELECT *` (this repo has older
-- views that use it, e.g. 0012/0013/0016, but that's exactly the kind of
-- thing a static analyzer flags and we'd have to revisit later) and
-- count(id) rather than count(*) for the same reason.

CREATE SCHEMA IF NOT EXISTS llm_usage;

CREATE TABLE llm_usage.scan_llm_usage (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id          uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  run_id           uuid NOT NULL REFERENCES cqms.runs(id) ON DELETE CASCADE,
  project_id       uuid NOT NULL REFERENCES cqms.projects(id) ON DELETE CASCADE,
  scanner_id       text NOT NULL REFERENCES cqms.scanners(scanner_id),
  outcome          text NOT NULL CHECK (outcome IN ('succeeded', 'failed', 'capped')),
  total_cost_usd   numeric(12, 6),  -- NULL for 'capped' (no API call made)
  num_turns        integer,         -- NULL for 'capped'
  error_message    text,            -- failure reason, or the cap-skip reason
  triggered_by     text,            -- resolved server-side from cqms.runs.triggered_by
  created_by       uuid REFERENCES cqms.users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scan_llm_usage_created_at_idx ON llm_usage.scan_llm_usage (created_at DESC);
CREATE INDEX scan_llm_usage_project_created_idx ON llm_usage.scan_llm_usage (project_id, created_at DESC);
CREATE INDEX scan_llm_usage_scanner_created_idx ON llm_usage.scan_llm_usage (scanner_id, created_at DESC);
CREATE INDEX scan_llm_usage_outcome_created_idx ON llm_usage.scan_llm_usage (outcome, created_at DESC);
CREATE INDEX scan_llm_usage_run_idx ON llm_usage.scan_llm_usage (run_id);

-- Uses the existing convenience wrapper (matches fn_mark_scan_failed /
-- fn_update_scan_progress exactly), not fn_assert_permission directly.
-- triggered_by is resolved here (not passed in) from cqms.runs, so the
-- TypeScript caller doesn't need to look it up separately.
CREATE FUNCTION llm_usage.fn_record_scan_llm_usage(
  p_user_id uuid, p_scan_id uuid, p_run_id uuid, p_project_id uuid,
  p_scanner_id text, p_outcome text, p_total_cost_usd numeric,
  p_num_turns integer, p_error_message text
)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  v_id uuid;
  v_triggered_by text;
BEGIN
  PERFORM cqms.fn_assert_update_permission(p_user_id, 'scan', p_scan_id);

  SELECT triggered_by INTO v_triggered_by FROM cqms.runs WHERE id = p_run_id;

  INSERT INTO llm_usage.scan_llm_usage (
    scan_id, run_id, project_id, scanner_id, created_by, triggered_by,
    outcome, total_cost_usd, num_turns, error_message
  ) VALUES (
    p_scan_id, p_run_id, p_project_id, p_scanner_id, p_user_id, v_triggered_by,
    p_outcome, p_total_cost_usd, p_num_turns, p_error_message
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

CREATE VIEW llm_usage.v_scan_llm_usage AS
  SELECT id, scan_id, run_id, project_id, scanner_id, outcome, total_cost_usd,
         num_turns, error_message, triggered_by, created_by, created_at
  FROM llm_usage.scan_llm_usage;

-- "Cost per day" — org-wide, backs the llm-usage report's trend panel.
CREATE VIEW llm_usage.v_daily_llm_cost AS
  SELECT
    date_trunc('day', created_at) AS usage_date,
    (count(id) FILTER (WHERE outcome <> 'capped'))::int AS call_count,
    (count(id) FILTER (WHERE outcome = 'capped'))::int AS capped_count,
    coalesce(sum(total_cost_usd) FILTER (WHERE outcome <> 'capped'), 0) AS total_cost_usd
  FROM llm_usage.scan_llm_usage
  GROUP BY date_trunc('day', created_at);

-- "Cost per scanner" — joined for display_name, matching how
-- getActiveScanners/getScannerListView already join cqms.v_scanners.
CREATE VIEW llm_usage.v_scanner_llm_cost AS
  SELECT
    u.scanner_id, s.display_name,
    (count(u.id) FILTER (WHERE u.outcome <> 'capped'))::int AS call_count,
    (count(u.id) FILTER (WHERE u.outcome = 'capped'))::int AS capped_count,
    coalesce(sum(u.total_cost_usd) FILTER (WHERE u.outcome <> 'capped'), 0) AS total_cost_usd
  FROM llm_usage.scan_llm_usage u
  JOIN cqms.v_scanners s ON s.scanner_id = u.scanner_id
  GROUP BY u.scanner_id, s.display_name;

-- "Cost per project".
CREATE VIEW llm_usage.v_project_llm_cost AS
  SELECT
    u.project_id, p.name AS project_name,
    (count(u.id) FILTER (WHERE u.outcome <> 'capped'))::int AS call_count,
    (count(u.id) FILTER (WHERE u.outcome = 'capped'))::int AS capped_count,
    coalesce(sum(u.total_cost_usd) FILTER (WHERE u.outcome <> 'capped'), 0) AS total_cost_usd
  FROM llm_usage.scan_llm_usage u
  JOIN cqms.v_projects p ON p.id = u.project_id
  GROUP BY u.project_id, p.name;

-- Capped/skipped attempts list — the report must separately surface these,
-- not just fold them into the cost totals (they cost $0 but still matter).
CREATE VIEW llm_usage.v_capped_llm_usage_attempts AS
  SELECT u.id, u.scan_id, u.run_id, u.project_id, p.name AS project_name,
         u.scanner_id, s.display_name AS scanner_display_name,
         u.triggered_by, u.error_message, u.created_at
  FROM llm_usage.scan_llm_usage u
  JOIN cqms.v_projects p ON p.id = u.project_id
  JOIN cqms.v_scanners s ON s.scanner_id = u.scanner_id
  WHERE u.outcome = 'capped';
