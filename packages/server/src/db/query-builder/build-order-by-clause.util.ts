import type { QuerySort } from './query-builder.types.ts';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

type BuildOrderByClauseArgs = {
  readonly allowedColumns?: readonly string[];
  readonly sort?: readonly QuerySort[];
};

export const buildOrderByClause = ({
  allowedColumns,
  sort = [],
}: BuildOrderByClauseArgs): string => {
  if (sort.length === 0) {
    return '';
  }

  const clauses = sort.map(({ column, direction }) => {
    assertSafeIdentifier(column);
    assertColumnAllowed({ allowedColumns, column });

    const directionSql = direction === 'desc' ? 'DESC' : 'ASC';
    return `${quoteIdentifier(column)} ${directionSql}`;
  });

  return `ORDER BY ${clauses.join(', ')}`;
};
