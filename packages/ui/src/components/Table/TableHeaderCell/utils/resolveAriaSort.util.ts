type ResolveAriaSortArgs = {
  readonly isSortable: boolean;
  readonly sortDirection: 'asc' | 'desc' | undefined;
};

/**
 * A column header's `aria-sort`, or `undefined` on a header that cannot be
 * sorted at all.
 *
 * The distinction is the point: `none` says "sortable, currently unsorted",
 * which is what a screen reader needs in order to offer the action, while an
 * absent attribute says the column does not participate in sorting. Announcing
 * `none` on a static column would advertise something that is not there.
 */
export const resolveAriaSort = ({
  isSortable,
  sortDirection,
}: ResolveAriaSortArgs) => {
  if (!isSortable) return;

  if (sortDirection === 'asc') return 'ascending';

  if (sortDirection === 'desc') return 'descending';

  return 'none';
};
