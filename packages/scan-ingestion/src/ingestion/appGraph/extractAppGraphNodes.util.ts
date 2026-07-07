import type { AppGraphNodeInput } from './appGraphDetail.types.ts';
import type { AppGraphRaw, AppGraphRawNode } from './appGraphRaw.schema.ts';

import { classifyFileTypeCategory } from '../classifyFileTypeCategory.util.ts';

type ExtractAppGraphNodesArgs = {
  readonly raw: AppGraphRaw;
};

/**
 * cqms.app_graph_nodes detail rows (ADR-022). Nodes without a usable
 * node_id are dropped (parent linkage and the (scan_id, node_id) unique
 * constraint both need it — degrading a drifted node beats failing the
 * scan). node_type is coerced onto the CHECK constraint's folder|file;
 * file_type_category reuses the repo's suffix-convention classifier and
 * is omitted for folders.
 */
export const extractAppGraphNodes = ({
  raw,
}: ExtractAppGraphNodesArgs): readonly AppGraphNodeInput[] =>
  raw.nodes
    .filter(
      (node): node is AppGraphRawNode & { readonly node_id: number } =>
        typeof node.node_id === 'number',
    )
    .map((node) => {
      const isFolder = node.node_type === 'folder';
      return {
        child_file_count: node.child_file_count,
        child_folder_count: node.child_folder_count,
        export_count: node.export_count,
        extension: node.extension,
        ...(!isFolder && {
          file_type_category: classifyFileTypeCategory(node.name),
        }),
        function_count: node.function_count,
        ...(!(node.line_count === null || node.line_count === undefined) && {
          line_count: node.line_count,
        }),
        name: node.name,
        nested_level: node.nested_level,
        node_id: node.node_id,
        node_type: isFolder ? ('folder' as const) : ('file' as const),
        ...(!(
          node.parent_node_id === null || node.parent_node_id === undefined
        ) && { parent_node_id: node.parent_node_id }),
        path: node.path,
        type_count: node.type_count,
      };
    });
