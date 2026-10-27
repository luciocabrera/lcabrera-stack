import { QueryRefusedError } from '../../errors/query-refused.error.ts';
import { MAX_IDENTIFIER_LENGTH } from '../group-query-builder/group-query-builder.constants.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

type BuildProjectedColumnArgs = {
  readonly isAliased: boolean;
  readonly name: string;
  readonly sql: string;
};

export const buildProjectedColumn = ({
  isAliased,
  name,
  sql,
}: BuildProjectedColumnArgs) => {
  if (!isAliased) {
    return sql;
  }

  if (name.length > MAX_IDENTIFIER_LENGTH) {
    throw new QueryRefusedError({
      column: name,
      message: `The projected alias "${name}" is longer than Postgres's ${MAX_IDENTIFIER_LENGTH}-byte identifier limit and would be truncated; pick a shorter join alias.`,
      reason: 'projected-alias-too-long',
    });
  }

  return `${sql} AS ${quoteIdentifier(name)}`;
};
