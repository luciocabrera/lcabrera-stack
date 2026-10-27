import type {
  ForeignKeyRelation,
  ReadJoin,
  ReadScopeSource,
} from './query-builder.types.ts';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';

type ResolveJoinRelationArgs = {
  readonly join: ReadJoin;
  readonly relations: readonly ForeignKeyRelation[];
  readonly source: ReadScopeSource;
};

export const resolveJoinRelation = ({
  join,
  relations,
  source,
}: ResolveJoinRelationArgs) => {
  if (join.foreignKey.length === 0) {
    throw new Error(
      `Join "${join.alias}" names no foreign-key column; a join is named by the referencing columns of a declared foreign key.`,
    );
  }

  for (const column of join.foreignKey) {
    assertSafeIdentifier(column);
    assertColumnAllowed({ allowedColumns: source.allowedColumns, column });
  }

  const named = new Set(join.foreignKey);
  const matches = relations.filter(
    (candidate) =>
      candidate.schema === source.schema &&
      candidate.table === source.table &&
      candidate.columns.length === named.size &&
      candidate.columns.every((column) => named.has(column)),
  );
  const listed = join.foreignKey.join(', ');

  if (matches.length > 1) {
    throw new Error(
      `Join "${join.alias}" is ambiguous: ${matches.length} foreign keys on "${source.schema}"."${source.table}" use (${listed}).`,
    );
  }

  const [relation] = matches;

  if (relation === undefined) {
    throw new Error(
      `Join "${join.alias}" follows no declared foreign key: "${source.schema}"."${source.table}" has none on (${listed}).`,
    );
  }

  if (relation.referencedColumns.length !== relation.columns.length) {
    throw new Error(
      `The foreign key on "${source.schema}"."${source.table}" (${listed}) pairs ${relation.columns.length} column(s) with ${relation.referencedColumns.length} referenced column(s).`,
    );
  }

  assertSafeIdentifier(relation.referencedSchema);
  assertSafeIdentifier(relation.referencedTable);

  for (const column of relation.referencedColumns) {
    assertSafeIdentifier(column);
  }

  return relation;
};
