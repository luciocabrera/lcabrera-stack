-- App-graph scanner (ADR-022, Phase-3 Step 8). A deterministic INVENTORY
-- scanner: one master row of tree-level aggregates per scan plus one
-- detail row per folder/file node. It emits 0 findings by design — the
-- value is the structural dataset (nesting, per-file export/function/type
-- counts via ts-morph), the groundwork for the Phase-2 symbol dependency
-- graph.
--
-- Follows ADR-018/019 conventions: fact tables carry created_by only;
-- reads via v_* views; the write goes through a p_user_id-first procedure
-- asserting permission before any DML; DELETE-then-INSERT keeps
-- re-ingestion idempotent.

INSERT INTO cqms.scanners (scanner_id, display_name, skill_path, deterministic, supports_diff_scope, is_active)
VALUES ('app-graph', 'App Graph (structure inventory)', '.github/skills/app-graph', true, false, true)
ON CONFLICT (scanner_id) DO NOTHING;

-- ── Master: 1:1 with the scan (the user-confirmed run/detail model) ──────

CREATE TABLE cqms.app_graph_runs (
  scan_id              uuid PRIMARY KEY REFERENCES cqms.scans(id) ON DELETE CASCADE,
  total_node_count     integer NOT NULL DEFAULT 0,
  folder_count         integer NOT NULL DEFAULT 0,
  file_count           integer NOT NULL DEFAULT 0,
  max_depth            integer NOT NULL DEFAULT 0,
  -- files ts-morph actually parsed for symbol counts (TS/JS family only)
  analyzed_file_count  integer NOT NULL DEFAULT 0,
  total_export_count   integer NOT NULL DEFAULT 0,
  total_function_count integer NOT NULL DEFAULT 0,
  total_type_count     integer NOT NULL DEFAULT 0,
  total_line_count     integer NOT NULL DEFAULT 0,
  created_by           uuid REFERENCES cqms.users(id),
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ── Detail: one row per tree node ─────────────────────────────────────────

CREATE TABLE cqms.app_graph_nodes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id             uuid NOT NULL REFERENCES cqms.scans(id) ON DELETE CASCADE,
  -- runner-assigned sequential id; parent linkage stays within the scan
  node_id             integer NOT NULL,
  parent_node_id      integer,         -- NULL only for the scan-root node
  node_type           text NOT NULL CHECK (node_type IN ('folder','file')),
  name                text NOT NULL,
  path                text NOT NULL,   -- project-root-relative ('.' = repo-scope root)
  extension           text NOT NULL DEFAULT '',
  file_type_category  text,            -- suffix-convention class, files only
  nested_level        integer NOT NULL DEFAULT 0,  -- depth from the SCAN root (root = 0)
  child_folder_count  integer NOT NULL DEFAULT 0,
  child_file_count    integer NOT NULL DEFAULT 0,
  export_count        integer NOT NULL DEFAULT 0,
  function_count      integer NOT NULL DEFAULT 0,
  type_count          integer NOT NULL DEFAULT 0,
  line_count          integer,         -- NULL when unreadable (binary etc.)
  created_by          uuid REFERENCES cqms.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scan_id, node_id)            -- doubles as the (scan_id) index
);
CREATE INDEX app_graph_nodes_scan_parent_idx ON cqms.app_graph_nodes (scan_id, parent_node_id);
CREATE INDEX app_graph_nodes_scan_path_idx   ON cqms.app_graph_nodes (scan_id, path);

-- ── Read views (ADR-018 rule) ────────────────────────────────────────────

CREATE VIEW cqms.v_app_graph_runs AS
  SELECT * FROM cqms.app_graph_runs;

CREATE VIEW cqms.v_app_graph_nodes AS
  SELECT * FROM cqms.app_graph_nodes;

-- ── Ingest procedure ─────────────────────────────────────────────────────
-- Additive — sp_ingest_scan_result stays untouched; dispatched by
-- ingestScanDetail AFTER it. REMINDER (ARCHITECTURE.md footgun):
-- jsonb_to_record(set) does NOT apply column DEFAULTs — the TS extractors
-- emit every NOT NULL field explicitly.

CREATE PROCEDURE cqms.sp_ingest_app_graph(
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
    type_count, line_count, created_by)
  SELECT p_scan_id, n.*, p_user_id FROM jsonb_to_recordset(p_nodes) AS n(
    node_id integer, parent_node_id integer, node_type text, name text,
    path text, extension text, file_type_category text, nested_level integer,
    child_folder_count integer, child_file_count integer,
    export_count integer, function_count integer, type_count integer,
    line_count integer);
END;
$$;
