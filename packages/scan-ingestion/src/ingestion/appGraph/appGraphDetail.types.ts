/**
 * Row inputs for cqms.sp_ingest_app_graph's jsonb_to_record(set) (ADR-022;
 * symbol node types + fields added by ADR-027). Optional keys are simply
 * omitted — JSON.stringify drops undefined and jsonb_to_recordset yields
 * SQL NULL for absent keys, which is exactly right for the nullable
 * columns (parent_node_id on the root node, file_type_category on folders
 * and symbols, line_count on unreadable files and symbols, and the
 * symbol-only fields on folder/file rows). The NOT NULL columns are always
 * emitted explicitly because jsonb_to_recordset never applies column
 * DEFAULTs (the documented ARCHITECTURE.md footgun) — this includes the 5
 * aggregate-count columns on symbol rows, which emit literal 0s since a
 * per-symbol export/function/type/child count is meaningless.
 */
export type AppGraphNodeInput = {
  readonly child_file_count: number;
  readonly child_folder_count: number;
  readonly end_line?: number;
  readonly export_count: number;
  readonly extension: string;
  readonly file_type_category?: string;
  readonly function_count: number;
  readonly is_component?: boolean;
  readonly is_exported?: boolean;
  readonly is_hook?: boolean;
  readonly line_count?: number;
  readonly name: string;
  readonly nested_level: number;
  readonly node_id: number;
  readonly node_type:
    | 'class'
    | 'enum'
    | 'file'
    | 'folder'
    | 'function'
    | 'interface'
    | 'method'
    | 'type_alias';
  readonly parent_node_id?: number;
  readonly path: string;
  readonly start_line?: number;
  readonly symbol_name?: string;
  readonly type_count: number;
};

/** The cqms.app_graph_runs master row (1:1 with the scan). */
export type AppGraphRunSummary = {
  readonly analyzed_file_count: number;
  readonly file_count: number;
  readonly folder_count: number;
  readonly max_depth: number;
  readonly total_export_count: number;
  readonly total_function_count: number;
  readonly total_line_count: number;
  readonly total_node_count: number;
  readonly total_type_count: number;
};
