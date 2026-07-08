import type { AppGraphNodeInput } from './appGraphDetail.types.ts';
import type { AppGraphRaw, AppGraphRawNode } from './appGraphRaw.schema.ts';

import { classifyFileTypeCategory } from '../classifyFileTypeCategory.util.ts';

type ExtractAppGraphNodesArgs = {
  readonly raw: AppGraphRaw;
};

// The full set of node_type values the CHECK constraint accepts (ADR-022's
// folder|file plus ADR-027's symbol kinds). Unlike the old two-value set,
// an unrecognized node_type can no longer be safely coerced onto 'file' —
// that would misfile a drifted symbol kind as a file row — so a node
// outside this set is dropped instead, the same graceful-degradation
// treatment already given to a node missing its node_id.
const KNOWN_NODE_TYPES = new Set<AppGraphNodeInput['node_type']>([
  'class',
  'enum',
  'file',
  'folder',
  'function',
  'interface',
  'method',
  'type_alias',
]);

const isKnownNodeType = (
  nodeType: string,
): nodeType is AppGraphNodeInput['node_type'] =>
  KNOWN_NODE_TYPES.has(nodeType as AppGraphNodeInput['node_type']);

/**
 * cqms.app_graph_nodes detail rows (ADR-022; symbol node types added by
 * ADR-027). Nodes without a usable node_id, or with a node_type outside
 * the CHECK constraint's known set, are dropped (parent linkage and the
 * (scan_id, node_id) unique constraint both need node_id; an unrecognized
 * node_type would fail the whole insert rather than just this row).
 * file_type_category reuses the repo's suffix-convention classifier and
 * only applies to 'file' rows (folders and symbols never get one). The
 * ADR-027 symbol fields (symbol_name/is_exported/is_component/is_hook/
 * start_line/end_line) are passed through whenever present — the runner
 * only ever sets them on symbol rows — and omitted otherwise, following
 * the same omit-nullable-keys convention as file_type_category/line_count/
 * parent_node_id.
 */
export const extractAppGraphNodes = ({
  raw,
}: ExtractAppGraphNodesArgs): readonly AppGraphNodeInput[] =>
  raw.nodes
    .filter(
      (
        node,
      ): node is AppGraphRawNode & {
        readonly node_id: number;
        readonly node_type: AppGraphNodeInput['node_type'];
      } => typeof node.node_id === 'number' && isKnownNodeType(node.node_type),
    )
    .map((node) => ({
      child_file_count: node.child_file_count,
      child_folder_count: node.child_folder_count,
      ...(!(node.end_line === null || node.end_line === undefined) && {
        end_line: node.end_line,
      }),
      export_count: node.export_count,
      extension: node.extension,
      ...(node.node_type === 'file' && {
        file_type_category: classifyFileTypeCategory(node.name),
      }),
      function_count: node.function_count,
      ...(!(node.is_component === null || node.is_component === undefined) && {
        is_component: node.is_component,
      }),
      ...(!(node.is_exported === null || node.is_exported === undefined) && {
        is_exported: node.is_exported,
      }),
      ...(!(node.is_hook === null || node.is_hook === undefined) && {
        is_hook: node.is_hook,
      }),
      ...(!(node.line_count === null || node.line_count === undefined) && {
        line_count: node.line_count,
      }),
      name: node.name,
      nested_level: node.nested_level,
      node_id: node.node_id,
      node_type: node.node_type,
      ...(!(
        node.parent_node_id === null || node.parent_node_id === undefined
      ) && { parent_node_id: node.parent_node_id }),
      path: node.path,
      ...(!(node.start_line === null || node.start_line === undefined) && {
        start_line: node.start_line,
      }),
      ...(!(node.symbol_name === null || node.symbol_name === undefined) && {
        symbol_name: node.symbol_name,
      }),
      type_count: node.type_count,
    }));
