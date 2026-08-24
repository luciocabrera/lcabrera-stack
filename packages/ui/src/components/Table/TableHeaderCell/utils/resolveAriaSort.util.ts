type ResolveAriaSortArgs = {
  readonly isSortable: boolean;
  readonly sortDirection: 'asc' | 'desc' | undefined;
};

/** A column header's `aria-sort`, or `undefined` on a header that cannot be sorted at all. */
export const resolveAriaSort = ({
  isSortable,
  sortDirection,
}: ResolveAriaSortArgs) => {
  if (!isSortable) return;

  if (sortDirection === 'asc') return 'ascending';

  if (sortDirection === 'desc') return 'descending';

  return 'none';
};
