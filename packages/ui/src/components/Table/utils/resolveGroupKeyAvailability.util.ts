import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { resolveColumnCapabilities } from './resolveColumnCapabilities.util';

type ResolveGroupKeyAvailabilityArgs<TData> = {
  /**
   * The catalogue's answer for this column, as the loader shipped it (ADR-063).
   * `undefined` means the route resolved none — not that the column is refused.
   */
  readonly capability: TableColumnGroupingCapability | undefined;
  readonly column: TableColumn<TData> | undefined;
};

/**
 * Whether a column may be **offered** as a group key, and the catalogue's reason
 * when it may not.
 *
 * Two gates answer this and they are answered in different places (ADR-058):
 * `TableColumn.isGroupable` is the consumer's declaration, resolved through
 * `resolveColumnCapabilities` like every other column flag, and the catalogue
 * decides what is actually legal from the column's real Postgres type and its
 * distinct-value statistics. This is where the second **narrows** the first, so
 * every grouping surface asks one question instead of pairing a flag test with a
 * capability lookup of its own.
 *
 * An absent capability leaves the declared answer standing, and that direction
 * matters: a route may group without shipping a capability map at all
 * (`resolveGroupingCapabilities` is optional), and reading absence as a refusal
 * would silently switch grouping off for it. It is the opposite of how an
 * *aggregate* menu reads absence — there, nothing offered means nothing legal,
 * because an aggregate is only ever legal by the catalogue's say-so.
 *
 * **The consumer's opt-out is checked first, and carries no reason.** A column
 * declared `isGroupable: false` is unavailable because the table said so, which
 * is a different fact from the database refusing it — and both can be true at
 * once. Reporting the catalogue's reason there would attribute the table's own
 * decision to the endpoint, and hand the user a sentence about distinct values
 * for a column that was never going to be on the menu. `undefined` is the
 * honest answer: the endpoint said nothing, and there is nothing to act on.
 *
 * **A column the catalogue refuses raw can still be offerable**, and reading
 * `canGroup` alone is what made period grouping unreachable from the UI: a date
 * column is refused at one group per calendar day and legal at a month, so
 * filtering it out of the add-key list left the granularity control with no way
 * to ever be rendered (ADR-084). Such a column comes back groupable with a
 * `requiredPeriod` — the granularity the caller **must** apply along with the
 * key, because adding it raw produces a read the server refuses.
 *
 * It cannot promise the read will succeed. The pre-flight row bound is a
 * property of the whole key combination rather than of any one column, and
 * statistics go stale, so a key that passes here can still be refused when the
 * query runs — which is why the refusal also has to render (#642).
 */
export const resolveGroupKeyAvailability = <TData>({
  capability,
  column,
}: ResolveGroupKeyAvailabilityArgs<TData>) => {
  const { isGroupable } = resolveColumnCapabilities(column);

  if (!isGroupable) {
    return {
      isGroupable: false,
      refusal: undefined,
      requiredPeriod: undefined,
    };
  }

  if (capability?.canGroup !== false) {
    return { isGroupable: true, refusal: undefined, requiredPeriod: undefined };
  }

  // Refused raw, but legal at a granularity: offerable, and only at one. The
  // finest on offer is the default because it is the most informative — a
  // reader can coarsen a month to a year and cannot recover the month from it.
  const [finest] = capability.periods;

  return finest === undefined
    ? {
        isGroupable: false,
        refusal: capability.refusal,
        requiredPeriod: undefined,
      }
    : { isGroupable: true, refusal: undefined, requiredPeriod: finest };
};
