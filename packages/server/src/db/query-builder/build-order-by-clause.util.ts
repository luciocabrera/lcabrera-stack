import type {
  ColumnReference,
  QuerySort,
  ReadScope,
} from './query-builder.types.ts';

import { resolveColumnReference } from './resolve-column-reference.util.ts';

type BuildOrderByClauseArgs = {
  readonly allowedColumns?: readonly string[];
  readonly scope?: ReadScope;
  readonly sort?: readonly QuerySort<ColumnReference>[];
};

export const buildOrderByClause = ({
  allowedColumns,
  scope,
  sort = [],
}: BuildOrderByClauseArgs): string => {
  if (sort.length === 0) {
    return '';
  }

  const clauses = sort.map(({ column, direction }) => {
    const directionSql = direction === 'desc' ? 'DESC' : 'ASC';
    const { sql } = resolveColumnReference({
      allowedColumns,
      reference: column,
      scope,
    });

    return `${sql} ${directionSql}`;
  });

  return `ORDER BY ${clauses.join(', ')}`;
};
