import type { ExecutorOptions } from './db.types.ts';
import type {
  ColumnCapabilitiesQueryDescriptor,
  ColumnCapabilityRow,
  ColumnGroupingCapability,
} from './group-query-builder/group-query-builder.types.ts';

import { buildColumnCapabilitiesQuery } from './group-query-builder/build-column-capabilities-query.util.ts';
import { resolveColumnCapability } from './group-query-builder/resolve-column-capability.util.ts';
import { runQuery } from './run-query.util.ts';

export const getColumnGroupingCapabilities = async ({
  tx,
  ...descriptor
}: ColumnCapabilitiesQueryDescriptor & ExecutorOptions): Promise<
  Readonly<Record<string, ColumnGroupingCapability>>
> => {
  const { text, values } = buildColumnCapabilitiesQuery(descriptor);
  const result = await runQuery<ColumnCapabilityRow>({ text, tx, values });

  return Object.fromEntries(
    result.rows.map((row) => [row.column, resolveColumnCapability(row)]),
  );
};
