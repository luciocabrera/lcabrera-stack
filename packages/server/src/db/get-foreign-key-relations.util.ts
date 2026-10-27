import type { ExecutorOptions } from './db.types.ts';
import type { ForeignKeyRelation } from './query-builder/query-builder.types.ts';

import { buildForeignKeyRelationsQuery } from './query-builder/build-foreign-key-relations-query.util.ts';
import { runQuery } from './run-query.util.ts';

type GetForeignKeyRelationsArgs = ExecutorOptions & {
  readonly depth: number;
  readonly schema: string;
  readonly table: string;
};

export const getForeignKeyRelations = async ({
  tx,
  ...descriptor
}: GetForeignKeyRelationsArgs): Promise<readonly ForeignKeyRelation[]> => {
  const { text, values } = buildForeignKeyRelationsQuery(descriptor);
  const result = await runQuery<ForeignKeyRelation>({ text, tx, values });

  return result.rows;
};
