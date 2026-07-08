import type { AppGraphRunSummary } from './appGraphDetail.types.ts';
import type { AppGraphRaw } from './appGraphRaw.schema.ts';

type ExtractAppGraphRunSummaryArgs = {
  readonly raw: AppGraphRaw;
};

/**
 * The cqms.app_graph_runs master row (1:1 with the scan, ADR-022) —
 * derived from the nodes array, NOT copied from the runner's own stats
 * block, so master and detail can never disagree (the code-smell masters
 * precedent: the verifiable rollup beats the tool's claimed counts).
 *
 * file_count/folder_count and the export/function/type/line totals filter
 * strictly on node_type === 'file' (and 'folder' for folder_count) rather
 * than the pre-ADR-027 `!== 'folder'` shorthand: with only two node types
 * that shorthand was equivalent to `=== 'file'`, but ADR-027 added
 * function/method/class/interface/type_alias/enum symbol rows alongside
 * file rows, and lumping those into "file" would inflate every one of
 * these aggregates. total_node_count and max_depth intentionally stay
 * whole-tree (all node types) — they describe the full node count / the
 * deepest nesting in the scan, which now legitimately includes symbol
 * nesting beneath a file.
 */
export const extractAppGraphRunSummary = ({
  raw,
}: ExtractAppGraphRunSummaryArgs): AppGraphRunSummary => {
  const fileNodes = raw.nodes.filter((node) => node.node_type === 'file');
  const folderCount = raw.nodes.filter(
    (node) => node.node_type === 'folder',
  ).length;

  return {
    analyzed_file_count: fileNodes.filter((node) => node.is_analyzed).length,
    file_count: fileNodes.length,
    folder_count: folderCount,
    max_depth: raw.nodes.reduce(
      (max, node) => Math.max(max, node.nested_level),
      0,
    ),
    total_export_count: fileNodes.reduce(
      (sum, node) => sum + node.export_count,
      0,
    ),
    total_function_count: fileNodes.reduce(
      (sum, node) => sum + node.function_count,
      0,
    ),
    total_line_count: fileNodes.reduce(
      (sum, node) => sum + (node.line_count ?? 0),
      0,
    ),
    total_node_count: raw.nodes.length,
    total_type_count: fileNodes.reduce((sum, node) => sum + node.type_count, 0),
  };
};
