import type { QuerySort } from './queryBuilder.types.ts';

import { assertColumnAllowed } from './assertColumnAllowed.util.ts';
import { assertSafeIdentifier } from './assertSafeIdentifier.util.ts';
import { quoteIdentifier } from './quoteIdentifier.util.ts';

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
