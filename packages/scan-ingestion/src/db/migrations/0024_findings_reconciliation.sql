-- Reconcile cqms.scan_findings with the per-scanner detail tables
-- (ADR-028, Step 1 of the findings-reconciliation plan). Today, the
-- generic scan_findings table and the fallow/lint detail tables
-- (fallow_dead_code, fallow_circular_dependencies, fallow_clone_groups,
-- fallow_function_findings, lint_violations) are populated by two
-- completely independent code paths reading the same raw tool output,
-- with no shared identifier between a scan_findings row and its
-- corresponding detail row. This migration adds the prose columns
-- (rule_id/severity/why/fix/confidence/effort/finding_id) directly onto
-- the 5 overlapping detail tables so they no longer need scan_findings at
-- all, and a new v_all_findings view that will let the read layer (Step
-- 1e) switch over once the extractors (Step 1d) populate these columns
-- and the dual-write into scan_findings stops (Step 1c). Until then, this
-- migration is additive/inert: the new columns are NULL on all existing
-- rows, nothing reads v_all_findings yet, and scan_findings keeps working
-- exactly as it does today.
--
-- Only 4 of fallow's 8 detail tables and 1 shared lint table ever
-- overlapped with scan_findings (traced via generate-fallow-report.mjs's
-- mapCheckFindings/mapCloneGroupFindings/mapFunctionFindings and the two
-- lint report generators) — fallow_file_scores/hotspots/large_functions/
-- targets are pure metrics with no scan_findings counterpart and are
-- untouched here.

-- ── fallow_dead_code: rule_id/severity/confidence/effort/why/fix/finding_id
--    location comes from the table's existing file_path/line/col ────────────

ALTER TABLE cqms.fallow_dead_code
  ADD COLUMN rule_id    varchar(255),
  ADD COLUMN severity   varchar(32) CHECK (severity IN ('BLOCKER','HIGH','MEDIUM','LOW','NIT')),
  ADD COLUMN confidence varchar(32),
  ADD COLUMN effort     varchar(32),
  ADD COLUMN why        text,
  ADD COLUMN fix        text,
  ADD COLUMN finding_id varchar(255);

-- `CREATE VIEW ... AS SELECT *` expands to the table's column list AT
-- CREATE TIME — Postgres does not retroactively add newly ALTERed columns
-- to an existing view (confirmed live via ADR-027's app_graph_nodes fix).
-- Every v_* passthrough view over a table touched below must be recreated.
CREATE OR REPLACE VIEW cqms.v_fallow_dead_code AS
  SELECT * FROM cqms.fallow_dead_code;

-- ── fallow_circular_dependencies: same 7 columns ─────────────────────────
--    location comes from the table's existing entry_file_path/line/col

ALTER TABLE cqms.fallow_circular_dependencies
  ADD COLUMN rule_id    varchar(255),
  ADD COLUMN severity   varchar(32) CHECK (severity IN ('BLOCKER','HIGH','MEDIUM','LOW','NIT')),
  ADD COLUMN confidence varchar(32),
  ADD COLUMN effort     varchar(32),
  ADD COLUMN why        text,
  ADD COLUMN fix        text,
  ADD COLUMN finding_id varchar(255);

CREATE OR REPLACE VIEW cqms.v_fallow_circular_dependencies AS
  SELECT * FROM cqms.fallow_circular_dependencies;

-- ── fallow_clone_groups: same 7 columns + explicit location_path/
--    location_hint (a group has no file_path/line of its own — the
--    original generic finding used the group's first instance; storing it
--    directly here, computed once by the extractor exactly like the old
--    makeFinding() call site did, avoids a runtime join in v_all_findings) ──

ALTER TABLE cqms.fallow_clone_groups
  ADD COLUMN rule_id       varchar(255),
  ADD COLUMN severity      varchar(32) CHECK (severity IN ('BLOCKER','HIGH','MEDIUM','LOW','NIT')),
  ADD COLUMN confidence    varchar(32),
  ADD COLUMN effort        varchar(32),
  ADD COLUMN why           text,
  ADD COLUMN fix           text,
  ADD COLUMN finding_id    varchar(255),
  ADD COLUMN location_path text,
  ADD COLUMN location_hint text;

CREATE OR REPLACE VIEW cqms.v_fallow_clone_groups AS
  SELECT * FROM cqms.fallow_clone_groups;

-- ── fallow_function_findings: existing `severity` (fallow's own
--    critical|high|moderate scale) renamed to severity_raw — mirrors the
--    lint_violations severity/severity_raw precedent exactly — plus a new
--    canonical `severity` and the remaining prose columns ───────────────

-- Postgres refuses to rename a base-table column while a dependent view
-- still references it under the old name — drop first, recreate after.
DROP VIEW cqms.v_fallow_function_findings;

ALTER TABLE cqms.fallow_function_findings RENAME COLUMN severity TO severity_raw;
ALTER INDEX cqms.fallow_function_findings_scan_severity_idx
  RENAME TO fallow_function_findings_scan_severity_raw_idx;

ALTER TABLE cqms.fallow_function_findings
  ADD COLUMN severity   varchar(32) CHECK (severity IN ('BLOCKER','HIGH','MEDIUM','LOW','NIT')),
  ADD COLUMN rule_id    varchar(255),
  ADD COLUMN confidence varchar(32),
  ADD COLUMN effort     varchar(32),
  ADD COLUMN why        text,
  ADD COLUMN fix        text,
  ADD COLUMN finding_id varchar(255);

CREATE INDEX fallow_function_findings_scan_severity_idx
  ON cqms.fallow_function_findings (scan_id, severity);

CREATE OR REPLACE VIEW cqms.v_fallow_function_findings AS
  SELECT * FROM cqms.fallow_function_findings;

-- ── lint_violations: rule_id/severity/message (as why) already exist;
--    only suggestion_text (eslint's real suggestions[].desc / fix.text,
--    oxlint's help) and finding_id are new ───────────────────────────────

ALTER TABLE cqms.lint_violations
  ADD COLUMN suggestion_text text,
  ADD COLUMN finding_id      varchar(255);

CREATE OR REPLACE VIEW cqms.v_lint_violations AS
  SELECT * FROM cqms.lint_violations;

-- ── v_all_findings: scan_findings UNION ALL the 5 detail tables, each
--    projected into the common shape. A given scan_id only ever has rows
--    in one branch (a scan belongs to exactly one scanner), so this stays
--    cheap — no join, predicate pushdown per branch on scan_id.
--
--    Each detail branch is gated on its own newly-added, previously-NULL
--    identity column (rule_id, or finding_id for lint_violations whose
--    rule_id already existed pre-migration) being NOT NULL. Until Step 1d
--    populates these columns for new scans and Step 1c stops the
--    scan_findings dual-write, every detail branch here contributes zero
--    rows and this view is equivalent to v_scan_findings alone — the
--    correct behavior for the current, mid-rollout state. Nothing reads
--    this view yet (Step 1e switches the read layer over once 1c/1d land).

CREATE VIEW cqms.v_all_findings AS
  SELECT scan_id, finding_id, rule_id, severity, confidence, location_path,
         location_hint, evidence_excerpt, why, fix, effort, status
  FROM cqms.v_scan_findings

  UNION ALL

  SELECT scan_id, finding_id, rule_id, severity, confidence,
         file_path AS location_path,
         CASE WHEN line IS NOT NULL
           THEN line::text || CASE WHEN col IS NOT NULL THEN ':' || col::text ELSE '' END
           ELSE NULL END AS location_hint,
         NULL::text AS evidence_excerpt,
         why, fix, effort,
         'open'::text AS status
  FROM cqms.v_fallow_dead_code
  WHERE rule_id IS NOT NULL

  UNION ALL

  SELECT scan_id, finding_id, rule_id, severity, confidence,
         entry_file_path AS location_path,
         CASE WHEN line IS NOT NULL
           THEN line::text || CASE WHEN col IS NOT NULL THEN ':' || col::text ELSE '' END
           ELSE NULL END AS location_hint,
         NULL::text AS evidence_excerpt,
         why, fix, effort,
         'open'::text AS status
  FROM cqms.v_fallow_circular_dependencies
  WHERE rule_id IS NOT NULL

  UNION ALL

  SELECT scan_id, finding_id, rule_id, severity, confidence,
         location_path, location_hint,
         NULL::text AS evidence_excerpt,
         why, fix, effort,
         'open'::text AS status
  FROM cqms.v_fallow_clone_groups
  WHERE rule_id IS NOT NULL

  UNION ALL

  SELECT scan_id, finding_id, rule_id, severity, confidence,
         file_path AS location_path,
         CASE WHEN line IS NOT NULL
           THEN line::text || CASE WHEN col IS NOT NULL THEN ':' || col::text ELSE '' END
           ELSE NULL END AS location_hint,
         NULL::text AS evidence_excerpt,
         why, fix, effort,
         'open'::text AS status
  FROM cqms.v_fallow_function_findings
  WHERE rule_id IS NOT NULL

  UNION ALL

  SELECT scan_id, finding_id, rule_id, severity, 'high'::text AS confidence,
         file_path AS location_path,
         CASE WHEN line IS NOT NULL
           THEN line::text || CASE WHEN col IS NOT NULL THEN ':' || col::text ELSE '' END
           ELSE NULL END AS location_hint,
         NULL::text AS evidence_excerpt,
         message AS why,
         suggestion_text AS fix,
         'small'::text AS effort,
         'open'::text AS status
  FROM cqms.v_lint_violations
  WHERE finding_id IS NOT NULL AND NOT suppressed;

-- ── Ingest procedures — append the new columns to both the INSERT list
--    and the jsonb_to_recordset AS-clause. REMINDER (ARCHITECTURE.md
--    footgun): jsonb_to_record(set) does NOT apply column DEFAULTs — but
--    every new column here is nullable, so an extractor that hasn't been
--    updated yet (pre-Step-1d) simply omits the key and gets SQL NULL,
--    which is exactly the inert, pre-rollout state described above. ──────

CREATE OR REPLACE PROCEDURE cqms.sp_ingest_eslint_detail(
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
    suppression_kind, suppression_justification, help_url, suggestion_text, finding_id,
    created_by)
  SELECT p_scan_id, v.*, p_user_id FROM jsonb_to_recordset(p_violations) AS v(
    source text, file_path text, rule_id text, severity_raw text, severity text,
    message text, message_id text, line integer, col integer, end_line integer,
    end_col integer, fixable boolean, suppressed boolean, suppression_kind text,
    suppression_justification text, help_url text, suggestion_text text, finding_id text);
END;
$$;

CREATE OR REPLACE PROCEDURE cqms.sp_ingest_oxlint_detail(
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
    suppression_kind, suppression_justification, help_url, suggestion_text, finding_id,
    created_by)
  SELECT p_scan_id, v.*, p_user_id FROM jsonb_to_recordset(p_violations) AS v(
    source text, file_path text, rule_id text, severity_raw text, severity text,
    message text, message_id text, line integer, col integer, end_line integer,
    end_col integer, fixable boolean, suppressed boolean, suppression_kind text,
    suppression_justification text, help_url text, suggestion_text text, finding_id text);
END;
$$;

CREATE OR REPLACE PROCEDURE cqms.sp_ingest_fallow_detail(
  p_user_id uuid, p_scan_id uuid, p_master jsonb, p_detail jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);

  DELETE FROM cqms.fallow_runs                  WHERE scan_id = p_scan_id;
  DELETE FROM cqms.fallow_file_scores           WHERE scan_id = p_scan_id;
  DELETE FROM cqms.fallow_hotspots              WHERE scan_id = p_scan_id;
  DELETE FROM cqms.fallow_clone_groups          WHERE scan_id = p_scan_id;
  DELETE FROM cqms.fallow_dead_code             WHERE scan_id = p_scan_id;
  DELETE FROM cqms.fallow_circular_dependencies WHERE scan_id = p_scan_id;
  DELETE FROM cqms.fallow_large_functions       WHERE scan_id = p_scan_id;
  DELETE FROM cqms.fallow_targets               WHERE scan_id = p_scan_id;
  DELETE FROM cqms.fallow_function_findings     WHERE scan_id = p_scan_id;

  INSERT INTO cqms.fallow_runs (scan_id,
    fallow_version, raw_kind, raw_schema_version, analysis_run_id, elapsed_ms,
    health_formula_version, health_score, health_grade, health_penalties,
    check_total_issues, check_summary, entry_points,
    files_analyzed, functions_analyzed, functions_above_threshold, files_scored,
    max_cyclomatic_threshold, max_cognitive_threshold, max_crap_threshold,
    average_maintainability, coverage_model, coverage_source_consistency,
    severity_critical_count, severity_high_count, severity_moderate_count,
    dead_file_pct, dead_export_pct, avg_cyclomatic, critical_complexity_pct,
    p90_cyclomatic, hotspot_count, hotspot_top_pct_count, maintainability_avg,
    maintainability_low_pct, unused_dep_count, unused_deps_per_k_files,
    circular_dep_count, circular_deps_per_k_files, functions_over_60_loc_per_k,
    p95_fan_in, coupling_high_pct, p95_render_fan_in, render_fan_in_high_pct,
    max_render_fan_in, total_loc,
    total_files, total_exports, dead_files, dead_exports, total_lines, total_deps,
    unit_size_profile, unit_interfacing_profile, top_render_fan_in,
    hotspot_summary, target_thresholds, framework_health,
    dupes_total_files, dupes_files_with_clones, dupes_total_lines,
    dupes_duplicated_lines, dupes_total_tokens, dupes_duplicated_tokens,
    clone_group_count, clone_instance_count, duplication_percentage,
    created_by)
  SELECT p_scan_id, m.*, p_user_id FROM jsonb_to_record(p_master) AS m(
    fallow_version text, raw_kind text, raw_schema_version integer,
    analysis_run_id text, elapsed_ms integer,
    health_formula_version integer, health_score numeric, health_grade text,
    health_penalties jsonb,
    check_total_issues integer, check_summary jsonb, entry_points jsonb,
    files_analyzed integer, functions_analyzed integer,
    functions_above_threshold integer, files_scored integer,
    max_cyclomatic_threshold integer, max_cognitive_threshold integer,
    max_crap_threshold integer, average_maintainability numeric,
    coverage_model text, coverage_source_consistency text,
    severity_critical_count integer, severity_high_count integer,
    severity_moderate_count integer,
    dead_file_pct numeric, dead_export_pct numeric, avg_cyclomatic numeric,
    critical_complexity_pct numeric, p90_cyclomatic numeric,
    hotspot_count integer, hotspot_top_pct_count integer,
    maintainability_avg numeric, maintainability_low_pct numeric,
    unused_dep_count integer, unused_deps_per_k_files numeric,
    circular_dep_count integer, circular_deps_per_k_files numeric,
    functions_over_60_loc_per_k numeric, p95_fan_in numeric,
    coupling_high_pct numeric, p95_render_fan_in numeric,
    render_fan_in_high_pct numeric, max_render_fan_in numeric,
    total_loc integer,
    total_files integer, total_exports integer, dead_files integer,
    dead_exports integer, total_lines integer, total_deps integer,
    unit_size_profile jsonb, unit_interfacing_profile jsonb,
    top_render_fan_in jsonb, hotspot_summary jsonb, target_thresholds jsonb,
    framework_health jsonb,
    dupes_total_files integer, dupes_files_with_clones integer,
    dupes_total_lines integer, dupes_duplicated_lines integer,
    dupes_total_tokens integer, dupes_duplicated_tokens integer,
    clone_group_count integer, clone_instance_count integer,
    duplication_percentage numeric);

  INSERT INTO cqms.fallow_file_scores (scan_id, file_path, fan_in, fan_out,
    dead_code_ratio, complexity_density, maintainability_index,
    total_cyclomatic, total_cognitive, function_count, lines, crap_max,
    crap_above_threshold, created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'file_scores', '[]'::jsonb)) AS r(
    file_path text, fan_in integer, fan_out integer, dead_code_ratio numeric,
    complexity_density numeric, maintainability_index numeric,
    total_cyclomatic integer, total_cognitive integer, function_count integer,
    lines integer, crap_max numeric, crap_above_threshold integer);

  INSERT INTO cqms.fallow_hotspots (scan_id, file_path, score, commits,
    weighted_commits, lines_added, lines_deleted, complexity_density, fan_in,
    trend, created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'hotspots', '[]'::jsonb)) AS r(
    file_path text, score numeric, commits integer, weighted_commits numeric,
    lines_added integer, lines_deleted integer, complexity_density numeric,
    fan_in integer, trend text);

  -- Two-pass WITH ORDINALITY: groups first (RETURNING their generated ids
  -- keyed by group_index), then instances joined back through the ordinal.
  WITH groups AS (
    SELECT value, ordinality
    FROM jsonb_array_elements(coalesce(p_detail->'clone_groups', '[]'::jsonb))
         WITH ORDINALITY
  ), inserted_groups AS (
    INSERT INTO cqms.fallow_clone_groups (scan_id, group_index, fingerprint,
      suggested_name, token_count, line_count, instance_count,
      rule_id, severity, confidence, effort, why, fix, finding_id,
      location_path, location_hint, created_by)
    SELECT p_scan_id, g.ordinality, g.value->>'fingerprint',
           g.value->>'suggested_name',
           coalesce((g.value->>'token_count')::integer, 0),
           coalesce((g.value->>'line_count')::integer, 0),
           coalesce(jsonb_array_length(g.value->'instances'), 0),
           g.value->>'rule_id', g.value->>'severity', g.value->>'confidence',
           g.value->>'effort', g.value->>'why', g.value->>'fix',
           g.value->>'finding_id', g.value->>'location_path',
           g.value->>'location_hint',
           p_user_id
    FROM groups g
    RETURNING id, group_index
  )
  INSERT INTO cqms.fallow_clone_instances (clone_group_id, scan_id, file_path,
    start_line, end_line, start_col, end_col, fragment, created_by)
  SELECT ig.id, p_scan_id, inst.file_path, inst.start_line, inst.end_line,
         inst.start_col, inst.end_col, inst.fragment, p_user_id
  FROM inserted_groups ig
  JOIN groups g ON g.ordinality = ig.group_index
  CROSS JOIN LATERAL jsonb_to_recordset(g.value->'instances') AS inst(
    file_path text, start_line integer, end_line integer, start_col integer,
    end_col integer, fragment text);

  INSERT INTO cqms.fallow_dead_code (scan_id, category, file_path,
    export_name, package_name, dependency_location, line, col, is_type_only,
    is_re_export, detail, rule_id, severity, confidence, effort, why, fix,
    finding_id, created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'dead_code', '[]'::jsonb)) AS r(
    category text, file_path text, export_name text, package_name text,
    dependency_location text, line integer, col integer, is_type_only boolean,
    is_re_export boolean, detail jsonb, rule_id text, severity text,
    confidence text, effort text, why text, fix text, finding_id text);

  INSERT INTO cqms.fallow_circular_dependencies (scan_id, cycle_length,
    entry_file_path, files, edges, line, col, rule_id, severity, confidence,
    effort, why, fix, finding_id, created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'circular_dependencies', '[]'::jsonb)) AS r(
    cycle_length integer, entry_file_path text, files jsonb, edges jsonb,
    line integer, col integer, rule_id text, severity text, confidence text,
    effort text, why text, fix text, finding_id text);

  INSERT INTO cqms.fallow_large_functions (scan_id, file_path, function_name,
    line, line_count, created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'large_functions', '[]'::jsonb)) AS r(
    file_path text, function_name text, line integer, line_count integer);

  INSERT INTO cqms.fallow_targets (scan_id, file_path, priority, efficiency,
    recommendation, category, effort, confidence, factors, evidence,
    created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'targets', '[]'::jsonb)) AS r(
    file_path text, priority numeric, efficiency numeric, recommendation text,
    category text, effort text, confidence text, factors jsonb,
    evidence jsonb);

  INSERT INTO cqms.fallow_function_findings (scan_id, file_path,
    function_name, line, col, cyclomatic, cognitive, line_count, param_count,
    exceeded, severity_raw, crap, coverage_tier, coverage_source,
    rule_id, severity, confidence, effort, why, fix, finding_id, created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'function_findings', '[]'::jsonb)) AS r(
    file_path text, function_name text, line integer, col integer,
    cyclomatic integer, cognitive integer, line_count integer,
    param_count integer, exceeded text, severity_raw text, crap numeric,
    coverage_tier text, coverage_source text, rule_id text, severity text,
    confidence text, effort text, why text, fix text, finding_id text);
END;
$$;
