import type { OlapDrillGroup } from '@lcabrera/api/olap/olap.types';

import type { OlapDrillRefusal } from './olap.types.ts';

type ResolveDrillRefusalArgs = {
  readonly group: OlapDrillGroup;
  readonly groupKeys: readonly string[];
};

/**
 * Why this group row cannot be drilled, or `undefined` when it can (ADR-079).
 * Separate from `toDrillRead`, which calls it, so a **route can ask before it pays**:
 * every reason here is a property of the row and the applied keys alone, so none of them
 * needs the filters, the sort, or the catalogue lookup a truncated key's boundary
 * arithmetic requires.
 */
export const resolveDrillRefusal = ({
  group,
  groupKeys,
}: ResolveDrillRefusalArgs): OlapDrillRefusal | undefined => {
  if (group.path.length === 0) return 'grand-total';
  if (group.isSubtotal) return 'subtotal';

  return group.path.length === groupKeys.length ? undefined : 'incomplete-path';
};
