import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { GroupQueryDescriptor } from './group-query-builder/group-query-builder.types.ts';

import { getColumnGroupingCapabilities } from './get-column-grouping-capabilities.util.ts';
import { buildGroupQuery } from './group-query-builder/build-group-query.util.ts';
import { collectCapabilityColumns } from './group-query-builder/collect-capability-columns.util.ts';
import { runQuery } from './run-query.util.ts';

/**
 * `capabilities` is resolved here rather than supplied, which is the whole
 * reason this executor exists: the builder is pure and needs the catalogue's
 * answer, and a caller left to fetch it itself would be one `await` away from
 * passing a hand-written map and defeating ADR-058's gates.
 */
type SelectGroupedRowsArgs = Omit<GroupQueryDescriptor, 'capabilities'>;

/**
 * Runs a grouped read: resolve what each column may do, build the
 * `GROUPING SETS` query from that answer, execute it.
 *
 * The flat sibling of `selectRows` for the analytical path. It returns the
 * emitted `aggregates`, `keys` and `maskAlias` beside the rows because a
 * grouped row cannot be decoded without them — an aggregate's alias is derived,
 * and the mask's bit positions are relative to the key order.
 *
 * `tx` threads through **both** round trips, so the capability answer and the
 * query it authorises see one snapshot. Omitted, each runs on the pool: fine
 * for a read, and the reason this does not open a transaction of its own — a
 * caller that needs the stronger guarantee already has `withTransaction`, and
 * one that does not should not pay for a connection it will not reuse.
 */
export const selectGroupedRows = async <TRow extends QueryResultRow>({
  tx,
  ...descriptor
}: ExecutorOptions & SelectGroupedRowsArgs) => {
  const capabilities = await getColumnGroupingCapabilities({
    columns: collectCapabilityColumns({
      aggregates: descriptor.aggregates,
      keys: descriptor.keys,
    }),
    schema: descriptor.schema,
    table: descriptor.table,
    tx,
  });

  const built = buildGroupQuery({ ...descriptor, capabilities });
  const result = await runQuery<TRow>({
    text: built.text,
    tx,
    values: built.values,
  });

  return {
    aggregates: built.aggregates,
    groupingSetMasks: built.groupingSetMasks,
    keys: built.keys,
    maskAlias: built.maskAlias,
    rows: result.rows as readonly TRow[],
  };
};
