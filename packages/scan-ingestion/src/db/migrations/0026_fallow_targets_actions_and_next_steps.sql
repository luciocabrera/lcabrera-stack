-- Persist two more fallow recommendation fields that were previously
-- dropped before ever reaching a queryable place (ADR-028, Step 1f):
-- health.targets[].actions (rich refactoring actions on fallow's own
-- prioritized targets — the actions field itself wasn't even in
-- fallowTargetSchema) and the top-level next_steps array (fallow's
-- suggested next CLI commands), absent from fallowRawSchema entirely.
-- Neither ever had a scan_findings counterpart — fallow's `targets`
-- section was never turned into generic findings — so there's no
-- reconciliation concern here, just a straightforward gap.

ALTER TABLE cqms.fallow_targets
  ADD COLUMN actions jsonb;

-- `CREATE VIEW ... AS SELECT *` doesn't pick up later ALTERed columns.
CREATE OR REPLACE VIEW cqms.v_fallow_targets AS
  SELECT * FROM cqms.fallow_targets;

CREATE TABLE cqms.fallow_next_steps (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id    uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  step_id    varchar(64),
  command    text,
  reason     text,
  created_by uuid REFERENCES cqms.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fallow_next_steps_scan_idx ON cqms.fallow_next_steps (scan_id);

CREATE VIEW cqms.v_fallow_next_steps AS
  SELECT * FROM cqms.fallow_next_steps;

-- sp_ingest_fallow_detail: append actions to the targets insert, add the
-- next_steps insert. Same DELETE-then-INSERT idempotency as every other
-- detail table.
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
  DELETE FROM cqms.fallow_next_steps            WHERE scan_id = p_scan_id;

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
    recommendation, category, effort, confidence, factors, evidence, actions,
    created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'targets', '[]'::jsonb)) AS r(
    file_path text, priority numeric, efficiency numeric, recommendation text,
    category text, effort text, confidence text, factors jsonb,
    evidence jsonb, actions jsonb);

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

  INSERT INTO cqms.fallow_next_steps (scan_id, step_id, command, reason,
    created_by)
  SELECT p_scan_id, r.*, p_user_id
  FROM jsonb_to_recordset(coalesce(p_detail->'next_steps', '[]'::jsonb)) AS r(
    step_id text, command text, reason text);
END;
$$;
