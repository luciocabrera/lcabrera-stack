import type {
  ForeignKeyRelation,
  ReadJoin,
  ReadScope,
  ReadScopeSource,
} from './query-builder.types.ts';

import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { buildJoinClause } from './build-join-clause.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';
import { resolveJoinRelation } from './resolve-join-relation.util.ts';

type ResolveReadScopeArgs = {
  readonly allowedColumns?: readonly string[];
  readonly joins?: readonly ReadJoin[];
  readonly relations?: readonly ForeignKeyRelation[];
  readonly schema: string;
  readonly table: string;
};

const JOIN_KINDS: ReadonlySet<string> = new Set(['inner', 'left']);

export const resolveReadScope = ({
  allowedColumns,
  joins = [],
  relations,
  schema,
  table,
}: ResolveReadScopeArgs): ReadScope | undefined => {
  if (joins.length === 0) {
    return undefined;
  }

  if (allowedColumns === undefined) {
    throw new Error(
      'A read with a join needs allowedColumns for its base target; reaching a second table cannot be left implicit.',
    );
  }

  if (relations === undefined) {
    throw new Error(
      'A read with a join needs the relation map; resolve it with getForeignKeyRelations.',
    );
  }

  const base: ReadScopeSource = {
    allowedColumns,
    qualifier: table,
    schema,
    table,
  };
  const sources = new Map<string, ReadScopeSource>();
  const clauses: string[] = [];

  for (const join of joins) {
    assertSafeIdentifier(join.alias);

    if (join.alias === table || sources.has(join.alias)) {
      throw new Error(
        `Join alias "${join.alias}" is already taken by the base target or an earlier join.`,
      );
    }

    if (!JOIN_KINDS.has(join.kind)) {
      throw new Error(
        `Join "${join.alias}" has kind "${String(join.kind)}"; only inner and left joins are offered.`,
      );
    }

    if (!Array.isArray(join.allowedColumns)) {
      throw new TypeError(
        `Join "${join.alias}" needs its own allowedColumns; every table a read reaches has one.`,
      );
    }

    const source = join.source === undefined ? base : sources.get(join.source);

    if (source === undefined) {
      throw new Error(
        `Join "${join.alias}" starts from "${join.source}", which is neither the base target nor an earlier join.`,
      );
    }

    const relation = resolveJoinRelation({ join, relations, source });

    clauses.push(
      buildJoinClause({
        alias: join.alias,
        kind: join.kind,
        relation,
        sourceQualifier: source.qualifier,
      }),
    );
    sources.set(join.alias, {
      allowedColumns: join.allowedColumns,
      qualifier: join.alias,
      schema: relation.referencedSchema,
      table: relation.referencedTable,
    });
  }

  return {
    base,
    from: [
      `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`,
      ...clauses,
    ].join(' '),
    joins: sources,
  };
};
