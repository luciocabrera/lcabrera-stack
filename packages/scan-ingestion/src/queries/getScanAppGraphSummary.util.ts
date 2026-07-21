import { getPool } from '@lcabrera/server/db/get-pool.util';

export type ScanAppGraphSummary = {
  readonly analyzed_file_count: number;
  readonly detail_file_count: number;
  readonly detail_folder_count: number;
  readonly detail_node_count: number;
  readonly file_count: number;
  readonly folder_count: number;
  readonly max_depth: number;
  readonly root_node_count: number;
  readonly total_export_count: number;
  readonly total_function_count: number;
  readonly total_line_count: number;
  readonly total_node_count: number;
  readonly total_type_count: number;
};

type GetScanAppGraphSummaryArgs = {
  readonly scanId: string;
};

/**
 * One scan's app-graph master row plus row counts over the node detail
 * view (ADR-022) — the analytics read proving master and detail line up
 * (detail_* must equal the master's counts, root_node_count must be 1).
 * Returns undefined when the scan has no master row.
 */
export const getScanAppGraphSummary = async ({
  scanId,
}: GetScanAppGraphSummaryArgs): Promise<ScanAppGraphSummary | undefined> => {
  const pool = getPool();
  const result = await pool.query<ScanAppGraphSummary>(
    `SELECT r.total_node_count, r.folder_count, r.file_count, r.max_depth,
            r.analyzed_file_count, r.total_export_count,
            r.total_function_count, r.total_type_count, r.total_line_count,
            (SELECT count(*)::int FROM cqms.v_app_graph_nodes
              WHERE scan_id = r.scan_id) AS detail_node_count,
            (SELECT count(*)::int FROM cqms.v_app_graph_nodes
              WHERE scan_id = r.scan_id AND node_type = 'folder') AS detail_folder_count,
            (SELECT count(*)::int FROM cqms.v_app_graph_nodes
              WHERE scan_id = r.scan_id AND node_type = 'file') AS detail_file_count,
            (SELECT count(*)::int FROM cqms.v_app_graph_nodes
              WHERE scan_id = r.scan_id AND parent_node_id IS NULL) AS root_node_count
     FROM cqms.v_app_graph_runs r
     WHERE r.scan_id = $1`,
    [scanId],
  );
  return result.rows[0];
};
