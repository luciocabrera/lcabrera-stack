-- Lint split + master/detail extraction (ADR-019). 'eslint' and 'oxlint'
-- become two independent scanners (the combined 'linter' is retired:
-- is_active=false + enabled=false, NOT soft-deleted — historical scans
-- keep a resolvable scanner reference). Every scan of either gets a 1:1
-- master row (run-level aggregates) and per-violation detail rows in the
-- shared cqms.lint_violations table, discriminated by source.
--
-- Follows ADR-018's conventions: fact tables carry created_by only; reads
-- go through v_* views; writes go through p_user_id-first procedures that
-- assert permission before any DML. DELETE-then-INSERT makes re-ingestion
-- (and a future backfill over historical raw_json) idempotent.

INSERT INTO cqms.scanners (scanner_id, display_name, skill_path, deterministic, supports_diff_scope, is_active)
VALUES
  ('eslint', 'ESLint (custom rules)', '.github/skills/linter-checker', true, false, true),
  ('oxlint', 'Oxlint',                '.github/skills/linter-checker', true, false, true)
ON CONFLICT (scanner_id) DO NOTHING;

UPDATE cqms.scanners
SET is_active = false, enabled = false, edited_at = now()
WHERE scanner_id = 'linter';

-- ── Detail: one row per violation, shared by both lint scanners ──────────

CREATE TABLE cqms.lint_violations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id       uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  source        varchar(32) NOT NULL CHECK (source IN ('eslint','oxlint')),
  file_path     text NOT NULL,   -- project-root-relative (workspace attribution relies on this)
  rule_id       varchar(255) NOT NULL,
  severity_raw  varchar(64) NOT NULL,   -- the tool's own value: oxlint 'error'/'warning'; eslint '2'/'1'
  severity      varchar(32) NOT NULL CHECK (severity IN ('BLOCKER','HIGH','MEDIUM','LOW','NIT')),
  message       text NOT NULL,
  message_id    varchar(64),            -- eslint messageId
  line          integer,
  col           integer,
  end_line      integer,
  end_col       integer,
  fixable       boolean NOT NULL DEFAULT false,
  -- eslint suppressedMessages: baselined debt, kept as queryable data.
  suppressed    boolean NOT NULL DEFAULT false,
  suppression_kind          varchar(32),   -- 'file' | 'directive'
  suppression_justification text,
  help_url      text,
  created_by    uuid REFERENCES cqms.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lint_violations_scan_idx      ON cqms.lint_violations (scan_id);
CREATE INDEX lint_violations_scan_file_idx ON cqms.lint_violations (scan_id, file_path);
CREATE INDEX lint_violations_scan_rule_idx ON cqms.lint_violations (scan_id, rule_id);
CREATE INDEX lint_violations_rule_idx      ON cqms.lint_violations (rule_id);

-- ── Masters: 1:1 with the scan (the user-confirmed run/detail model) ─────

CREATE TABLE cqms.eslint_runs (
  scan_id                uuid PRIMARY KEY REFERENCES cqms.scans(id) ON DELETE CASCADE,
  files_linted           integer NOT NULL DEFAULT 0,
  error_count            integer NOT NULL DEFAULT 0,
  fatal_error_count      integer NOT NULL DEFAULT 0,
  warning_count          integer NOT NULL DEFAULT 0,
  fixable_error_count    integer NOT NULL DEFAULT 0,
  fixable_warning_count  integer NOT NULL DEFAULT 0,
  suppressed_count       integer NOT NULL DEFAULT 0,
  -- distinct rule ids among ACTIVE messages (suppressed tracked separately)
  rules_violated_count   integer NOT NULL DEFAULT 0,
  created_by             uuid REFERENCES cqms.users(id),
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cqms.oxlint_runs (
  scan_id          uuid PRIMARY KEY REFERENCES cqms.scans(id) ON DELETE CASCADE,
  number_of_files  integer NOT NULL DEFAULT 0,
  number_of_rules  integer NOT NULL DEFAULT 0,
  error_count      integer NOT NULL DEFAULT 0,
  warning_count    integer NOT NULL DEFAULT 0,
  created_by       uuid REFERENCES cqms.users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Read views (ADR-018 rule) ────────────────────────────────────────────

CREATE VIEW cqms.v_lint_violations AS
  SELECT * FROM cqms.lint_violations;

CREATE VIEW cqms.v_eslint_runs AS
  SELECT * FROM cqms.eslint_runs;

CREATE VIEW cqms.v_oxlint_runs AS
  SELECT * FROM cqms.oxlint_runs;

-- Per-file aggregates are a VIEW, not a table — run_file_stats precedent
-- (0003): one source of truth, the rollup is a query shape.
CREATE VIEW cqms.lint_file_stats AS
  SELECT scan_id, file_path,
         count(*) FILTER (WHERE NOT suppressed)                         AS active_count,
         count(*) FILTER (WHERE suppressed)                             AS suppressed_count,
         count(*) FILTER (WHERE severity = 'HIGH'   AND NOT suppressed) AS high_count,
         count(*) FILTER (WHERE severity = 'MEDIUM' AND NOT suppressed) AS medium_count,
         count(*) FILTER (WHERE fixable AND NOT suppressed)             AS fixable_count
  FROM cqms.lint_violations
  GROUP BY scan_id, file_path;

-- ── Ingest procedures ────────────────────────────────────────────────────
-- Additive — sp_ingest_scan_result stays untouched; these run AFTER it,
-- dispatched by ingestReport per scanner. DELETE-then-INSERT (scoped by
-- source in the shared detail table) keeps re-ingestion idempotent.
-- REMINDER (ARCHITECTURE.md footgun): jsonb_to_record(set) does NOT apply
-- column DEFAULTs — the TS extractors emit every NOT NULL field explicitly.

CREATE PROCEDURE cqms.sp_ingest_eslint_detail(
  p_user_id uuid, p_scan_id uuid, p_master jsonb, p_violations jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);

  DELETE FROM cqms.eslint_runs WHERE scan_id = p_scan_id;
  INSERT INTO cqms.eslint_runs (scan_id, files_linted, error_count, fatal_error_count,
    warning_count, fixable_error_count, fixable_warning_count, suppressed_count,
    rules_violated_count, created_by)
  SELECT p_scan_id, m.*, p_user_id FROM jsonb_to_record(p_master) AS m(
    files_linted integer, error_count integer, fatal_error_count integer,
    warning_count integer, fixable_error_count integer, fixable_warning_count integer,
    suppressed_count integer, rules_violated_count integer);

  DELETE FROM cqms.lint_violations WHERE scan_id = p_scan_id AND source = 'eslint';
  INSERT INTO cqms.lint_violations (scan_id, source, file_path, rule_id, severity_raw,
    severity, message, message_id, line, col, end_line, end_col, fixable, suppressed,
    suppression_kind, suppression_justification, help_url, created_by)
  SELECT p_scan_id, v.*, p_user_id FROM jsonb_to_recordset(p_violations) AS v(
    source text, file_path text, rule_id text, severity_raw text, severity text,
    message text, message_id text, line integer, col integer, end_line integer,
    end_col integer, fixable boolean, suppressed boolean, suppression_kind text,
    suppression_justification text, help_url text);
END;
$$;

CREATE PROCEDURE cqms.sp_ingest_oxlint_detail(
  p_user_id uuid, p_scan_id uuid, p_master jsonb, p_violations jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);

  DELETE FROM cqms.oxlint_runs WHERE scan_id = p_scan_id;
  INSERT INTO cqms.oxlint_runs (scan_id, number_of_files, number_of_rules,
    error_count, warning_count, created_by)
  SELECT p_scan_id, m.*, p_user_id FROM jsonb_to_record(p_master) AS m(
    number_of_files integer, number_of_rules integer,
    error_count integer, warning_count integer);

  DELETE FROM cqms.lint_violations WHERE scan_id = p_scan_id AND source = 'oxlint';
  INSERT INTO cqms.lint_violations (scan_id, source, file_path, rule_id, severity_raw,
    severity, message, message_id, line, col, end_line, end_col, fixable, suppressed,
    suppression_kind, suppression_justification, help_url, created_by)
  SELECT p_scan_id, v.*, p_user_id FROM jsonb_to_recordset(p_violations) AS v(
    source text, file_path text, rule_id text, severity_raw text, severity text,
    message text, message_id text, line integer, col integer, end_line integer,
    end_col integer, fixable boolean, suppressed boolean, suppression_kind text,
    suppression_justification text, help_url text);
END;
$$;
