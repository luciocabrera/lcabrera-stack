import type { GroupTreeNode } from './resolveGroupTreeNodes.util';

import { ROOT_PARENT_KEY } from './resolveGroupTreeNodes.util';

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
