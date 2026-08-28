import type { TableLockedFilters } from '../Table.types';

const HEADING_SEPARATOR = ' · ';

/** `undefined` on no entries, refused included, so a caller keeps its own title. */
export const toLockedFiltersHeading = (
  lockedFilters: TableLockedFilters | undefined,
) =>
  lockedFilters === undefined || lockedFilters.entries.length === 0
    ? undefined
    : lockedFilters.entries
        .map(({ label, value }) => `${label}: ${value}`)
        .join(HEADING_SEPARATOR);
