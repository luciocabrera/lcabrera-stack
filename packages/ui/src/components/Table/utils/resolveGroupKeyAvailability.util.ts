import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { resolveColumnCapabilities } from './resolveColumnCapabilities.util';

type ResolveGroupKeyAvailabilityArgs<TData> = {
  /** The catalogue's answer for this column, as the loader shipped it (ADR-063). */
  readonly capability: TableColumnGroupingCapability | undefined;
  readonly column: TableColumn<TData> | undefined;
};

/**
 * Catalogue narrows the consumer's `isGroupable` (ADR-058).
 * Do not read `canGroup` alone: a date refused raw can still be offered with a
 * `requiredPeriod` (ADR-084).
 * Consumer opt-out carries no catalogue reason.
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
