import type { SortingState } from '@lcabrera/ui/components/Table';

import { sanitizeSorting } from './sanitizeSorting.util';

type ToQuerySortArgs<TData extends Record<string, unknown>> = {
  readonly sorting: SortingState<TData>;
};

/**
 * Rename a table `SortingState` to the `{ column, direction }` shape a
 * paginated endpoint's ORDER BY takes — the sorting counterpart to what
 * `@lcabrera/server`'s `toQueryFilters` does for filters. The result is
 * structurally assignable to that package's `QuerySort` with no adapter, which
 * is how a client-safe package stays out of a Node-only one's dependency graph
 * (ADR-039).
 *
 * `sanitizeSorting` drops the entries the sort cannot use, so the result stays
 * the same length and in the same order as the keyset cursor tuple
 * `toKeysetCursorValues` builds from the same sorting — a mismatch there costs
 * the cursor, and the page falls back to counting rows.
 */
export const toQuerySort = <TData extends Record<string, unknown>>({
  sorting,
}: ToQuerySortArgs<TData>) =>
  sanitizeSorting<TData>(sorting).map(({ columnKey, direction }) => ({
    column: columnKey,
    direction,
  }));
