import type {
  ColumnFiltersState,
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { toGroupKeyColumnFilter } from '#ui/components/Table/utils/toGroupKeyColumnFilter.util';
import { serializeFiltersToURL } from '#ui/utils/urlState';

type ResolveDrillHandoffSearchArgs<TData extends Record<string, unknown>> = {
  readonly columnFilters: ColumnFiltersState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly path: readonly TableGroupKeyValue[];
  /** The current location's search string, so every other param survives. */
  readonly search: string;
};

/**
 * The search string a hand-off navigates to: this table, ungrouped, filtered to
 * the group the reader was looking at (ADR-079).
 *
 * **Grouping is dropped and the group's keys become filters.** Those are the
 * same statement said two ways — a rollup level and an equality select the same
 * rows — so the ungrouped view opens on exactly the set the group row counted.
 * Every other param is carried through untouched: a hand-off changes what is
 * being asked, not how the rest of the page is configured.
 *
 * **The view's own filters are merged under the group's, not replaced.** Both
 * apply: the group row was itself computed under the view's filters, so a
 * hand-off that dropped them would open on a larger set than the count it was
 * offered beside. A key filter wins a collision, because a column cannot be both
 * grouped-by and filtered to something else in the set being handed off.
 *
 * **`undefined` means the hand-off cannot be offered, and that is a refusal.** A
 * NULL key and an object-valued key both produce no filter — the filter
 * vocabulary has no "is null" member, and `String()` over an object yields
 * `[object Object]` — so a link built past one would open a table showing the
 * wrong rows under the right heading. Every key must be expressible or none of
 * it is; the cell then states the shortfall without offering to navigate.
 */
export const resolveDrillHandoffSearch = <
  TData extends Record<string, unknown>,
>({
  columnFilters,
  columns,
  path,
  search,
}: ResolveDrillHandoffSearchArgs<TData>) => {
  const keyFilters: Record<string, unknown> = {};

  for (const { columnKey, value } of path) {
    const filter = toGroupKeyColumnFilter({
      dataType: columns.find((column) => String(column.key) === columnKey)
        ?.dataType,
      value,
    });

    if (filter === undefined) return;

    keyFilters[columnKey] = filter;
  }

  const params = new URLSearchParams(search);

  params.delete('grouping');

  const merged = {
    ...columnFilters,
    ...keyFilters,
  } as ColumnFiltersState;
  const serialized = serializeFiltersToURL(merged);

  if (serialized === undefined) {
    params.delete('filters');
  } else {
    params.set('filters', serialized);
  }

  return `?${params.toString()}`;
};
