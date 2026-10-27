import type { ExecutorOptions } from './db.types.ts';
import type {
  ForeignKeyRelation,
  ReadJoin,
} from './query-builder/query-builder.types.ts';

import { getForeignKeyRelations } from './get-foreign-key-relations.util.ts';

type ResolveReadRelationsArgs = ExecutorOptions & {
  readonly joins?: readonly ReadJoin[];
  readonly relations?: readonly ForeignKeyRelation[];
  readonly schema: string;
  readonly table: string;
};

export const resolveReadRelations = async ({
  joins = [],
  relations,
  schema,
  table,
  tx,
}: ResolveReadRelationsArgs) =>
  relations !== undefined || joins.length === 0
    ? relations
    : getForeignKeyRelations({ depth: joins.length, schema, table, tx });
