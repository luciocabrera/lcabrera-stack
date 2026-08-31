type ResolveAriaSortArgs = {
  readonly isSortable: boolean;
  readonly sortDirection: 'asc' | 'desc' | undefined;
};

export const resolveAriaSort = ({
  isSortable,
  sortDirection,
}: ResolveAriaSortArgs) => {
  if (!isSortable) return;

  if (sortDirection === 'asc') return 'ascending';

  if (sortDirection === 'desc') return 'descending';

  return 'none';
};
