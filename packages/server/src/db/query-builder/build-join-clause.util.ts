import type { ForeignKeyRelation, JoinKind } from './query-builder.types.ts';

import { quoteIdentifier } from './quote-identifier.util.ts';

type BuildJoinClauseArgs = {
  readonly alias: string;
  readonly kind: JoinKind;
  readonly relation: ForeignKeyRelation;
  readonly sourceQualifier: string;
};

const JOIN_SQL: Readonly<Record<JoinKind, string>> = {
  inner: 'INNER JOIN',
  left: 'LEFT JOIN',
};

export const buildJoinClause = ({
  alias,
  kind,
  relation,
  sourceQualifier,
}: BuildJoinClauseArgs) => {
  const quotedAlias = quoteIdentifier(alias);
  const quotedSource = quoteIdentifier(sourceQualifier);
  const equalities = relation.columns.map(
    (column, index) =>
      `${quotedSource}.${quoteIdentifier(column)} = ${quotedAlias}.${quoteIdentifier(relation.referencedColumns[index] ?? '')}`,
  );
  const target = `${quoteIdentifier(relation.referencedSchema)}.${quoteIdentifier(relation.referencedTable)}`;

  return `${JOIN_SQL[kind]} ${target} AS ${quotedAlias} ON ${equalities.join(' AND ')}`;
};
