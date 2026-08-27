import type { TableLockedFilters } from '../Table.types';

const HEADING_SEPARATOR = ' · ';

/**
 * The locked filters as one line, for a surface with a single line to spend — a dialog
 * title over a table whose panel already lists them.
 * `undefined` when there is nothing to say, so a caller falls back to its own title rather
 * than drawing an empty one. That is not the same as "unrestricted": a restriction that
 * could not be read has no entries either, and it is `refusal` that says so.
 */
export const toLockedFiltersHeading = (
  lockedFilters: TableLockedFilters | undefined,
) =>
  lockedFilters === undefined || lockedFilters.entries.length === 0
    ? undefined
    : lockedFilters.entries
        .map(({ label, value }) => `${label}: ${value}`)
        .join(HEADING_SEPARATOR);
