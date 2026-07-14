-- Code-smell masters + detail views (ADR-019 addendum, Phase-3 Step 5).
-- The two LLM scanners get their 1:1 master rows so every scanner satisfies
-- the run↔master model. Their findings already land in the canonical
-- cqms.scan_findings shape, so the "detail tables" are VIEWS filtered by
-- scanner (the run_file_stats precedent — a second table copy of the same
-- fact would just drift).
--
-- Master columns: report metadata (report_id/generated_at/files_analyzed/
-- top_risk) plus rollups DERIVED FROM THE FINDINGS ARRAY (severity,
-- confidence, effort, distinct rules) — the confidence/effort dimensions
-- the generic cqms.reports projection deliberately does not carry.
-- cqms.reports keeps the tool's own claimed counts; these masters are the
-- verifiable findings-derived rollup. No model/session columns: neither
-- report.json nor the agent runner surfaces them today (the plan sketch
-- assumed they existed) — add columns when the data does.

CREATE TABLE cqms.code_smell_checker_runs (
  scan_id                 uuid PRIMARY KEY REFERENCES cqms.scans(id) ON DELETE CASCADE,
  report_id               varchar(64),
  generated_at            timestamptz,
  files_analyzed          integer NOT NULL DEFAULT 0,
  finding_count           integer NOT NULL DEFAULT 0,
  blocker_count           integer NOT NULL DEFAULT 0,
  high_count              integer NOT NULL DEFAULT 0,
  medium_count            integer NOT NULL DEFAULT 0,
  low_count               integer NOT NULL DEFAULT 0,
  nit_count               integer NOT NULL DEFAULT 0,
  confidence_high_count   integer NOT NULL DEFAULT 0,
  confidence_medium_count integer NOT NULL DEFAULT 0,
  confidence_low_count    integer NOT NULL DEFAULT 0,
  effort_small_count      integer NOT NULL DEFAULT 0,
  effort_medium_count     integer NOT NULL DEFAULT 0,
  effort_large_count      integer NOT NULL DEFAULT 0,
  rules_flagged_count     integer NOT NULL DEFAULT 0,
  top_risk                text,
  created_by              uuid REFERENCES cqms.users(id),
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cqms.code_smell_zen_runs (
  scan_id                 uuid PRIMARY KEY REFERENCES cqms.scans(id) ON DELETE CASCADE,
  report_id               varchar(64),
  generated_at            timestamptz,
  files_analyzed          integer NOT NULL DEFAULT 0,
  finding_count           integer NOT NULL DEFAULT 0,
  blocker_count           integer NOT NULL DEFAULT 0,
  high_count              integer NOT NULL DEFAULT 0,
  medium_count            integer NOT NULL DEFAULT 0,
  low_count               integer NOT NULL DEFAULT 0,
  nit_count               integer NOT NULL DEFAULT 0,
  confidence_high_count   integer NOT NULL DEFAULT 0,
  confidence_medium_count integer NOT NULL DEFAULT 0,
  confidence_low_count    integer NOT NULL DEFAULT 0,
  effort_small_count      integer NOT NULL DEFAULT 0,
  effort_medium_count     integer NOT NULL DEFAULT 0,
  effort_large_count      integer NOT NULL DEFAULT 0,
  rules_flagged_count     integer NOT NULL DEFAULT 0,
  top_risk                text,
  created_by              uuid REFERENCES cqms.users(id),
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ── Read views (ADR-018 rule) ────────────────────────────────────────────

CREATE VIEW cqms.v_code_smell_checker_runs AS
  SELECT * FROM cqms.code_smell_checker_runs;

CREATE VIEW cqms.v_code_smell_zen_runs AS
  SELECT * FROM cqms.code_smell_zen_runs;

-- Detail = a scanner-filtered projection of the canonical findings table.
-- Built on the v_* soft-delete-filtering views so a soft-deleted scan's
-- findings disappear here too.
CREATE VIEW cqms.code_smell_checker_findings AS
  SELECT f.*
  FROM cqms.v_scan_findings f
  JOIN cqms.v_scans s ON s.id = f.scan_id
  WHERE s.scanner_id = 'code-smell-checker';

CREATE VIEW cqms.code_smell_zen_findings AS
  SELECT f.*
  FROM cqms.v_scan_findings f
  JOIN cqms.v_scans s ON s.id = f.scan_id
  WHERE s.scanner_id = 'code-smell-zen';

-- ── Ingest procedures ────────────────────────────────────────────────────
-- Additive — sp_ingest_scan_result stays untouched; dispatched by
-- ingestScanDetail AFTER it. DELETE-then-INSERT keeps re-ingestion
-- idempotent. REMINDER (ARCHITECTURE.md footgun): jsonb_to_record does NOT
-- apply column DEFAULTs — the TS extractor emits every NOT NULL field.

CREATE PROCEDURE cqms.sp_ingest_code_smell_checker_detail(
  p_user_id uuid, p_scan_id uuid, p_master jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);

  DELETE FROM cqms.code_smell_checker_runs WHERE scan_id = p_scan_id;
  INSERT INTO cqms.code_smell_checker_runs (scan_id, report_id, generated_at,
    files_analyzed, finding_count, blocker_count, high_count, medium_count,
    low_count, nit_count, confidence_high_count, confidence_medium_count,
    confidence_low_count, effort_small_count, effort_medium_count,
    effort_large_count, rules_flagged_count, top_risk, created_by)
  SELECT p_scan_id, m.*, p_user_id FROM jsonb_to_record(p_master) AS m(
    report_id text, generated_at timestamptz, files_analyzed integer,
    finding_count integer, blocker_count integer, high_count integer,
    medium_count integer, low_count integer, nit_count integer,
    confidence_high_count integer, confidence_medium_count integer,
    confidence_low_count integer, effort_small_count integer,
    effort_medium_count integer, effort_large_count integer,
    rules_flagged_count integer, top_risk text);
END;
$$;

CREATE PROCEDURE cqms.sp_ingest_code_smell_zen_detail(
  p_user_id uuid, p_scan_id uuid, p_master jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);

  DELETE FROM cqms.code_smell_zen_runs WHERE scan_id = p_scan_id;
  INSERT INTO cqms.code_smell_zen_runs (scan_id, report_id, generated_at,
    files_analyzed, finding_count, blocker_count, high_count, medium_count,
    low_count, nit_count, confidence_high_count, confidence_medium_count,
    confidence_low_count, effort_small_count, effort_medium_count,
    effort_large_count, rules_flagged_count, top_risk, created_by)
  SELECT p_scan_id, m.*, p_user_id FROM jsonb_to_record(p_master) AS m(
    report_id text, generated_at timestamptz, files_analyzed integer,
    finding_count integer, blocker_count integer, high_count integer,
    medium_count integer, low_count integer, nit_count integer,
    confidence_high_count integer, confidence_medium_count integer,
    confidence_low_count integer, effort_small_count integer,
    effort_medium_count integer, effort_large_count integer,
    rules_flagged_count integer, top_risk text);
END;
$$;
