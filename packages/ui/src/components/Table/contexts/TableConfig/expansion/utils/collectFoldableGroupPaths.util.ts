import type { GroupTreeNode } from './resolveGroupTreeNodes.util';

import { ROOT_PARENT_KEY } from './resolveGroupTreeNodes.util';

/**
 * *Owns rows* is read off the **tree**, never off adjacency.
 * The obvious walk asks whether the next row is deeper, and that is only right while a
 * parent precedes its children: rollup emits a subtotal **after** the rows it totals
 * (#570), so an adjacency test reports every subtotal as childless and leaves the one row
 * a user most wants to fold unfoldable.
 */
export const collectFoldableGroupPaths = (nodes: readonly GroupTreeNode[]) => {
  const parentKeys = new Set<string>();
  const ownKeys = new Set<string>();

  for (const node of nodes) {
    if (node.parentKey !== ROOT_PARENT_KEY) parentKeys.add(node.parentKey);
    if (node.pathKey !== undefined) ownKeys.add(node.pathKey);
  }

  const foldable = new Set<string>();

  for (const pathKey of parentKeys) {
    if (ownKeys.has(pathKey)) foldable.add(pathKey);
  }

  return foldable;
};
