-- Deterministic fallow + master/detail extraction (ADR-019 addendum,
-- Phase-3 Step 4). fallow flips to deterministic: the orchestrator runs
-- `fallow --format json` directly via generate-fallow-report.mjs instead
-- of an LLM agent session (LLM triage stays interactive-only via the
-- /fallow-code-checker skill). Every fallow scan gets a 1:1 master row
-- (the wide run-level metrics that were trapped in scans.health_metrics/
-- raw_json) plus per-item detail rows for each fallow section.
--
-- Conventions per ADR-018/019: fact tables carry created_by/created_at
-- only; reads via v_* views; writes via the p_user_id-first procedure
-- below (DELETE-then-INSERT — idempotent re-ingestion and safe backfill
-- over historical raw_json). File paths are stored exactly as fallow
-- reports them: relative to the scanned repo's git root, which equals
-- project-root-relative for root-registered projects (the canonical
-- registration model; Step 7's workspace attribution relies on this).

UPDATE cqms.scanners
SET deterministic = true, edited_at = now()
WHERE scanner_id = 'fallow';

-- ── Master: 1:1 with the scan — the wide fallow metrics row ──────────────
-- health_score/grade/penalties come from standalone `fallow health` runs
-- only; the combined run this scanner performs does not emit them → NULL.

CREATE TABLE cqms.fallow_runs (
  scan_id                     uuid PRIMARY KEY REFERENCES cqms.scans(id) ON DELETE CASCADE,
  -- tool identity / provenance
  fallow_version              text,
  raw_kind                    text,     -- 'combined' for full runs
  raw_schema_version          integer,
  analysis_run_id             text,
  elapsed_ms                  integer,
  -- overall score (standalone health runs only — nullable by design)
  health_formula_version      integer,
  health_score                numeric,
  health_grade                text,
  health_penalties            jsonb,
  -- check (dead code) section
  check_total_issues          integer NOT NULL DEFAULT 0,
  check_summary               jsonb,    -- the full per-category counts, verbatim
  entry_points                jsonb,
  -- health.summary
  files_analyzed              integer NOT NULL DEFAULT 0,
  functions_analyzed          integer NOT NULL DEFAULT 0,
  functions_above_threshold   integer NOT NULL DEFAULT 0,
  files_scored                integer NOT NULL DEFAULT 0,
  max_cyclomatic_threshold    integer,
  max_cognitive_threshold     integer,
  max_crap_threshold          integer,
  average_maintainability     numeric,
  coverage_model              text,
  coverage_source_consistency text,
  severity_critical_count     integer NOT NULL DEFAULT 0,
  severity_high_count         integer NOT NULL DEFAULT 0,
  severity_moderate_count     integer NOT NULL DEFAULT 0,
  -- health.vital_signs scalars
  dead_file_pct               numeric,
  dead_export_pct             numeric,
  avg_cyclomatic              numeric,
  critical_complexity_pct     numeric,
  p90_cyclomatic              numeric,
  hotspot_count               integer,
  hotspot_top_pct_count       integer,
  maintainability_avg         numeric,
  maintainability_low_pct     numeric,
  unused_dep_count            integer,
  unused_deps_per_k_files     numeric,
  circular_dep_count          integer,
  circular_deps_per_k_files   numeric,
  functions_over_60_loc_per_k numeric,
  p95_fan_in                  numeric,
  coupling_high_pct           numeric,
  p95_render_fan_in           numeric,
  render_fan_in_high_pct      numeric,
  max_render_fan_in           numeric,
  total_loc                   integer,
  -- health.vital_signs.counts
  total_files                 integer,
  total_exports               integer,
  dead_files                  integer,
  dead_exports                integer,
  total_lines                 integer,
  total_deps                  integer,
  -- profile shapes (kept as jsonb — distributions, not scalar metrics)
  unit_size_profile           jsonb,
  unit_interfacing_profile    jsonb,
  top_render_fan_in           jsonb,
  hotspot_summary             jsonb,
  target_thresholds           jsonb,
  framework_health            jsonb,
  -- dupes.stats
  dupes_total_files           integer,
  dupes_files_with_clones     integer,
  dupes_total_lines           integer,
  dupes_duplicated_lines      integer,
  dupes_total_tokens          integer,
  dupes_duplicated_tokens     integer,
  clone_group_count           integer NOT NULL DEFAULT 0,
  clone_instance_count        integer NOT NULL DEFAULT 0,
  duplication_percentage      numeric,
  created_by                  uuid REFERENCES cqms.users(id),
  created_at                  timestamptz NOT NULL DEFAULT now()
);

-- ── Details ──────────────────────────────────────────────────────────────

-- Per-file health scores — the analytics goldmine (~1 row per scored file).
CREATE TABLE cqms.fallow_file_scores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id               uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  file_path             text NOT NULL,
  fan_in                integer NOT NULL DEFAULT 0,
  fan_out               integer NOT NULL DEFAULT 0,
  dead_code_ratio       numeric,
  complexity_density    numeric,
  maintainability_index numeric,
  total_cyclomatic      integer,
  total_cognitive       integer,
  function_count        integer,
  lines                 integer,
  crap_max              numeric,
  crap_above_threshold  integer,
  created_by            uuid REFERENCES cqms.users(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fallow_file_scores_scan_idx      ON cqms.fallow_file_scores (scan_id);
CREATE INDEX fallow_file_scores_scan_file_idx ON cqms.fallow_file_scores (scan_id, file_path);

-- Git-churn × complexity hotspots.
CREATE TABLE cqms.fallow_hotspots (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id            uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  file_path          text NOT NULL,
  score              numeric,
  commits            integer,
  weighted_commits   numeric,
  lines_added        integer,
  lines_deleted      integer,
  complexity_density numeric,
  fan_in             integer,
  trend              text,
  created_by         uuid REFERENCES cqms.users(id),
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fallow_hotspots_scan_idx ON cqms.fallow_hotspots (scan_id);

-- Duplicate-code groups + their instances (dupes.clone_groups).
-- group_index preserves the raw JSON array order (1-based, WITH ORDINALITY).
CREATE TABLE cqms.fallow_clone_groups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id        uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  group_index    integer NOT NULL,
  fingerprint    text,
  suggested_name text,
  token_count    integer NOT NULL DEFAULT 0,
  line_count     integer NOT NULL DEFAULT 0,
  instance_count integer NOT NULL DEFAULT 0,
  created_by     uuid REFERENCES cqms.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scan_id, group_index)
);
CREATE INDEX fallow_clone_groups_scan_idx ON cqms.fallow_clone_groups (scan_id);

CREATE TABLE cqms.fallow_clone_instances (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_group_id uuid NOT NULL REFERENCES cqms.fallow_clone_groups(id) ON DELETE CASCADE,
  scan_id        uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  file_path      text NOT NULL,
  start_line     integer,
  end_line       integer,
  start_col      integer,
  end_col        integer,
  fragment       text,
  created_by     uuid REFERENCES cqms.users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fallow_clone_instances_scan_idx  ON cqms.fallow_clone_instances (scan_id);
CREATE INDEX fallow_clone_instances_group_idx ON cqms.fallow_clone_instances (clone_group_id);

-- Every dead-code style item from the check section, discriminated by
-- category. file_path is NULL for unlisted dependencies (multi-site — the
-- sites live in detail.imported_from). detail keeps the item's auxiliary
-- evidence (actions / imported_from / used_in_workspaces) verbatim.
CREATE TABLE cqms.fallow_dead_code (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id             uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  category            text NOT NULL CHECK (category IN
    ('unused_file','unused_export','unused_type','unused_dependency','unlisted_dependency','unresolved_import')),
  file_path           text,
  export_name         text,
  package_name        text,
  dependency_location text,   -- 'dependencies' | 'devDependencies' | 'optionalDependencies'
  line                integer,
  col                 integer,
  is_type_only        boolean,
  is_re_export        boolean,
  detail              jsonb,
  created_by          uuid REFERENCES cqms.users(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fallow_dead_code_scan_idx          ON cqms.fallow_dead_code (scan_id);
CREATE INDEX fallow_dead_code_scan_category_idx ON cqms.fallow_dead_code (scan_id, category);

CREATE TABLE cqms.fallow_circular_dependencies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  cycle_length    integer NOT NULL DEFAULT 0,
  entry_file_path text,               -- files[0], for quick filtering
  files           jsonb NOT NULL DEFAULT '[]'::jsonb,  -- the ordered cycle
  edges           jsonb,
  line            integer,
  col             integer,
  created_by      uuid REFERENCES cqms.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fallow_circular_dependencies_scan_idx ON cqms.fallow_circular_dependencies (scan_id);

CREATE TABLE cqms.fallow_large_functions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id       uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  file_path     text NOT NULL,
  function_name text,
  line          integer,
  line_count    integer NOT NULL DEFAULT 0,
  created_by    uuid REFERENCES cqms.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fallow_large_functions_scan_idx ON cqms.fallow_large_functions (scan_id);

-- Refactoring targets (fallow's own prioritized recommendations).
CREATE TABLE cqms.fallow_targets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id        uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  file_path      text NOT NULL,
  priority       numeric,
  efficiency     numeric,
  recommendation text,
  category       text,
  effort         text,
  confidence     text,
  factors        jsonb,
  evidence       jsonb,
  created_by     uuid REFERENCES cqms.users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fallow_targets_scan_idx ON cqms.fallow_targets (scan_id);

-- Per-function threshold violations (health.findings). severity keeps
-- fallow's own scale (critical|high|moderate) — the canonical BLOCKER..NIT
-- mapping lives in the generic scan_findings layer, not here.
CREATE TABLE cqms.fallow_function_findings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  file_path       text NOT NULL,
  function_name   text,
  line            integer,
  col             integer,
  cyclomatic      integer,
  cognitive       integer,
  line_count      integer,
  param_count     integer,
  exceeded        text,
  severity        text,
  crap            numeric,
  coverage_tier   text,
  coverage_source text,
  created_by      uuid REFERENCES cqms.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fallow_function_findings_scan_idx          ON cqms.fallow_function_findings (scan_id);
CREATE INDEX fallow_function_findings_scan_severity_idx ON cqms.fallow_function_findings (scan_id, severity);

-- ── Read views (ADR-018 rule) ────────────────────────────────────────────

CREATE VIEW cqms.v_fallow_runs AS
  SELECT * FROM cqms.fallow_runs;
CREATE VIEW cqms.v_fallow_file_scores AS
  SELECT * FROM cqms.fallow_file_scores;
CREATE VIEW cqms.v_fallow_hotspots AS
  SELECT * FROM cqms.fallow_hotspots;
CREATE VIEW cqms.v_fallow_clone_groups AS
  SELECT * FROM cqms.fallow_clone_groups;
CREATE VIEW cqms.v_fallow_clone_instances AS
  SELECT * FROM cqms.fallow_clone_instances;
CREATE VIEW cqms.v_fallow_dead_code AS
  SELECT * FROM cqms.fallow_dead_code;
CREATE VIEW cqms.v_fallow_circular_dependencies AS
  SELECT * FROM cqms.fallow_circular_dependencies;
CREATE VIEW cqms.v_fallow_large_functions AS
  SELECT * FROM cqms.fallow_large_functions;
CREATE VIEW cqms.v_fallow_targets AS
  SELECT * FROM cqms.fallow_targets;
CREATE VIEW cqms.v_fallow_function_findings AS
  SELECT * FROM cqms.fallow_function_findings;

-- ── Ingest procedure ─────────────────────────────────────────────────────
-- Additive — sp_ingest_scan_result stays untouched; this runs AFTER it,
-- dispatched by ingestScanDetail. DELETE-then-INSERT keeps re-ingestion
-- idempotent (clone instances cascade from their group delete).
-- REMINDER (ARCHITECTURE.md footgun): jsonb_to_record(set) does NOT apply
-- column DEFAULTs — the TS extractors emit every NOT NULL field explicitly.

CREATE PROCEDURE cqms.sp_ingest_fallow_detail(
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
      suggested_name, token_count, line_count, instance_count, created_by)
    SELECT p_scan_id, g.ordinality, g.value->>'fingerprint',
           g.value->>'suggested_name',
           coalesce((g.value->>'token_count')::integer, 0),
           coalesce((g.value->>'line_count')::integer, 0),
           coalesce(jsonb_array_length(g.value->'instances'), 0),
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
    is_re_export, detail, created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'dead_code', '[]'::jsonb)) AS r(
    category text, file_path text, export_name text, package_name text,
    dependency_location text, line integer, col integer, is_type_only boolean,
    is_re_export boolean, detail jsonb);

  INSERT INTO cqms.fallow_circular_dependencies (scan_id, cycle_length,
    entry_file_path, files, edges, line, col, created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'circular_dependencies', '[]'::jsonb)) AS r(
    cycle_length integer, entry_file_path text, files jsonb, edges jsonb,
    line integer, col integer);

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
    exceeded, severity, crap, coverage_tier, coverage_source, created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'function_findings', '[]'::jsonb)) AS r(
    file_path text, function_name text, line integer, col integer,
    cyclomatic integer, cognitive integer, line_count integer,
    param_count integer, exceeded text, severity text, crap numeric,
    coverage_tier text, coverage_source text);
END;
$$;
