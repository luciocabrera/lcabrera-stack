import type { GroupTreeNode } from './resolveGroupTreeNodes.util';

import { ROOT_PARENT_KEY } from './resolveGroupTreeNodes.util';

/**
 * The groups a reader can actually fold: the ones that own rows **and** have a
 * row of their own to fold from.
 *
 * *Owns rows* is read off the **tree**, never off adjacency. The obvious walk
 * asks whether the next row is deeper, and that is only right while a parent
 * precedes its children: rollup emits a subtotal **after** the rows it totals
 * (#570), so an adjacency test reports every subtotal as childless and leaves
 * the one row a user most wants to fold unfoldable.
 *
 * *Has a row of its own* is the second half, and it is what a set of parent
 * keys alone gets wrong. Under `flat` every emitted row carries the full key
 * list, so `(Berlin)` is the parent of `(Berlin, Open)` while no row anywhere
 * **is** `(Berlin)` — folding it would hide every row of the group and leave
 * nothing behind to reopen it from, which is a one-way trip out of the data
 * (#774). Under rollup the same path has a subtotal row, which survives the
 * fold and carries the control back; that difference is exactly what this
 * intersection encodes.
 *
 * Both halves are asked of the **loaded** nodes rather than the visible ones,
 * so a collapsed group still reports the children it is hiding — which is what
 * keeps its control present and `aria-expanded` false rather than vanishing on
 * collapse.
 *
 * `ROOT_PARENT_KEY` cannot survive either half — it is no row's path key — but
 * it is dropped explicitly all the same, so the result is a set of real group
 * paths whichever way the tree is later changed.
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
