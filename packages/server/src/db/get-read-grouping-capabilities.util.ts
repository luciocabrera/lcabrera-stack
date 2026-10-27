import type { ExecutorOptions } from './db.types.ts';
import type {
  ColumnReference,
  ReadScope,
} from './query-builder/query-builder.types.ts';

import { getColumnGroupingCapabilities } from './get-column-grouping-capabilities.util.ts';

type GetReadGroupingCapabilitiesArgs = ExecutorOptions & {
  readonly references: readonly ColumnReference[];
  readonly schema: string;
  readonly scope?: ReadScope;
  readonly table: string;
};

export const getReadGroupingCapabilities = async ({
  references,
  schema,
  scope,
  table,
  tx,
}: GetReadGroupingCapabilitiesArgs) => {
  const joinedReferences = references.filter(
    (reference) => typeof reference !== 'string',
  );
  const sources = [...(scope?.joins ?? [])].filter(([alias]) =>
    joinedReferences.some((reference) => reference.source === alias),
  );

  const resolved = await Promise.all([
    getColumnGroupingCapabilities({
      columns: references.filter((reference) => typeof reference === 'string'),
      schema,
      table,
      tx,
    }),
    ...sources.map(async ([alias, source]) => {
      const capabilities = await getColumnGroupingCapabilities({
        columns: joinedReferences
          .filter((reference) => reference.source === alias)
          .map((reference) => reference.column),
        schema: source.schema,
        table: source.table,
        tx,
      });

      return Object.fromEntries(
        Object.entries(capabilities).map(([column, capability]) => [
          `${alias}.${column}`,
          capability,
        ]),
      );
    }),
  ]);

  return Object.fromEntries(
    resolved.flatMap((capabilities) => Object.entries(capabilities)),
  );
};
