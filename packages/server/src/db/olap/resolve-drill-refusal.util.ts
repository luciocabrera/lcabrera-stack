import type { OlapDrillGroup } from '@lcabrera/api/olap/olap.types';

import type { OlapDrillRefusal } from './olap.types.ts';

type ResolveDrillRefusalArgs = {
  readonly group: OlapDrillGroup;
  /** The applied group keys, in nesting order — what "complete" is measured against. */
  readonly groupKeys: readonly string[];
};

/**
 * Why this group row cannot be drilled, or `undefined` when it can (ADR-079).
 *
 * Separate from `toDrillRead`, which calls it, so a **route can ask before it
 * pays**: every reason here is a property of the row and the applied keys
 * alone, so none of them needs the filters, the sort, or the catalogue lookup a
 * truncated key's boundary arithmetic requires. Asking first is what stops a
 * subtotal costing a round trip to be told no (#786).
 *
 * The grand total is tested **first**: it is *also* `isSubtotal`, so the
 * subtotal rule ahead of it would report every grand total as a subtotal and
 * hide the more specific answer.
 */
export const resolveDrillRefusal = ({
  group,
  groupKeys,
}: ResolveDrillRefusalArgs): OlapDrillRefusal | undefined => {
  if (group.path.length === 0) return 'grand-total';
  if (group.isSubtotal) return 'subtotal';

  return group.path.length === groupKeys.length ? undefined : 'incomplete-path';
};
