import type { TableLockedFilters } from '../Table.types';

const HEADING_SEPARATOR = ' · ';

/**
 * The locked filters as one line, for a surface with a single line to spend. `undefined`
 * when there are no entries — including a restriction that was refused — so a caller falls
 * back to its own title rather than drawing an empty one
 * ([ADR-094](../../../../../../docs/decisions/ADR-094-a-scoped-table-states-its-restriction-and-opens-declared.md)).
 */
export const toLockedFiltersHeading = (
  lockedFilters: TableLockedFilters | undefined,
) =>
  lockedFilters === undefined || lockedFilters.entries.length === 0
    ? undefined
    : lockedFilters.entries
        .map(({ label, value }) => `${label}: ${value}`)
        .join(HEADING_SEPARATOR);
