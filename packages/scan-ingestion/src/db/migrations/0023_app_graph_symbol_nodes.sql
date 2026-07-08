-- App-graph symbol nodes (ADR-027, Phase-3 Step 8 follow-up). Extends the
-- ADR-022 tree (cqms.app_graph_nodes) with one row per named function,
-- method, class, interface, type alias, and enum — recursively, to
-- arbitrary nesting depth, chained via the existing parent_node_id. No new
-- tables: a symbol node's parent is either the file node (top-level
-- declaration) or the immediately-enclosing named declaration's own node.
-- No edges/references this round — nodes only.

-- ── Widen the node_type CHECK to the new symbol kinds ─────────────────────

ALTER TABLE cqms.app_graph_nodes DROP CONSTRAINT app_graph_nodes_node_type_check;
ALTER TABLE cqms.app_graph_nodes ADD CONSTRAINT app_graph_nodes_node_type_check
  CHECK (node_type IN ('folder', 'file', 'function', 'method', 'class',
                        'interface', 'type_alias', 'enum'));

-- ── New nullable columns — meaningless for folder/file rows, so no
--    backfill and no NOT NULL (jsonb_to_recordset never applies column
--    DEFAULTs, but these have none to apply) ───────────────────────────────

ALTER TABLE cqms.app_graph_nodes
  ADD COLUMN symbol_name  text,
  ADD COLUMN is_exported  boolean,
  ADD COLUMN is_component boolean,
  ADD COLUMN is_hook      boolean,
  ADD COLUMN start_line   integer,
  ADD COLUMN end_line     integer;

CREATE INDEX app_graph_nodes_scan_type_idx        ON cqms.app_graph_nodes (scan_id, node_type);
CREATE INDEX app_graph_nodes_scan_symbol_name_idx ON cqms.app_graph_nodes (scan_id, symbol_name);

-- `CREATE VIEW ... AS SELECT *` expands to the table's column list AT
-- CREATE TIME — Postgres does NOT retroactively add newly ALTERed columns
-- to an existing view. cqms.v_app_graph_nodes (0014) predates the 6
-- columns just added above, so it must be recreated to pick them up.
CREATE OR REPLACE VIEW cqms.v_app_graph_nodes AS
  SELECT * FROM cqms.app_graph_nodes;

-- ── Ingest procedure — append the new columns to both the INSERT list and
--    the jsonb_to_recordset AS-clause. The 5 pre-existing NOT NULL count
--    columns (child_folder_count/child_file_count/export_count/
--    function_count/type_count) still must be emitted explicitly by every
--    row, symbol rows included — the extractor follows the same convention
--    file rows already use (literal 0s, not a reliance on the column
--    DEFAULT, since jsonb_to_recordset never applies it).

CREATE OR REPLACE PROCEDURE cqms.sp_ingest_app_graph(
  p_user_id uuid, p_scan_id uuid, p_master jsonb, p_nodes jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  PERFORM cqms.fn_assert_permission(p_user_id, 'update', 'scan', p_scan_id);

  DELETE FROM cqms.app_graph_runs WHERE scan_id = p_scan_id;
  INSERT INTO cqms.app_graph_runs (scan_id, total_node_count, folder_count,
    file_count, max_depth, analyzed_file_count, total_export_count,
    total_function_count, total_type_count, total_line_count, created_by)
  SELECT p_scan_id, m.*, p_user_id FROM jsonb_to_record(p_master) AS m(
    total_node_count integer, folder_count integer, file_count integer,
    max_depth integer, analyzed_file_count integer, total_export_count integer,
    total_function_count integer, total_type_count integer,
    total_line_count integer);

  DELETE FROM cqms.app_graph_nodes WHERE scan_id = p_scan_id;
  INSERT INTO cqms.app_graph_nodes (scan_id, node_id, parent_node_id,
    node_type, name, path, extension, file_type_category, nested_level,
    child_folder_count, child_file_count, export_count, function_count,
    type_count, line_count, symbol_name, is_exported, is_component, is_hook,
    start_line, end_line, created_by)
  SELECT p_scan_id, n.*, p_user_id FROM jsonb_to_recordset(p_nodes) AS n(
    node_id integer, parent_node_id integer, node_type text, name text,
    path text, extension text, file_type_category text, nested_level integer,
    child_folder_count integer, child_file_count integer,
    export_count integer, function_count integer, type_count integer,
    line_count integer, symbol_name text, is_exported boolean,
    is_component boolean, is_hook boolean, start_line integer,
    end_line integer);
END;
$$;
