import type { QueryResultRow } from 'pg';

import type { ExecutorOptions, TransactionClient } from './db.types.ts';
import type { GroupQueryDescriptor } from './group-query-builder/group-query-builder.types.ts';

import { readGroupStatementTimeoutMs } from './env.schema.ts';
import { getColumnGroupingCapabilities } from './get-column-grouping-capabilities.util.ts';
import { assertGroupDepth } from './group-query-builder/assert-group-depth.util.ts';
import { assertGroupRowBackstop } from './group-query-builder/assert-group-row-backstop.util.ts';
import { buildGroupQuery } from './group-query-builder/build-group-query.util.ts';
import { collectCapabilityColumns } from './group-query-builder/collect-capability-columns.util.ts';
import { toGroupKeyTruncations } from './olap/to-group-key-truncations.util.ts';
import { runQuery } from './run-query.util.ts';
import { setStatementTimeout } from './set-statement-timeout.util.ts';
import { withTransaction } from './with-transaction.util.ts';

type SelectGroupedRowsArgs = Omit<GroupQueryDescriptor, 'capabilities'>;

export const selectGroupedRows = async <TRow extends QueryResultRow>({
  tx,
  ...descriptor
}: ExecutorOptions & SelectGroupedRowsArgs) => {
  assertGroupDepth({
    grouping: descriptor.grouping,
    keys: descriptor.keys,
  });

  const run = async (client: TransactionClient) => {
    await setStatementTimeout({
      timeoutMs: readGroupStatementTimeoutMs({ env: process.env }),
      tx: client,
    });

    const capabilities = await getColumnGroupingCapabilities({
      columns: collectCapabilityColumns({
        aggregates: descriptor.aggregates,
        keys: descriptor.keys,
      }),
      schema: descriptor.schema,
      table: descriptor.table,
      tx: client,
    });

    const built = buildGroupQuery({ ...descriptor, capabilities });
    const result = await runQuery<TRow>({
      text: built.text,
      tx: client,
      values: built.values,
    });

    assertGroupRowBackstop({
      rowCount: result.rows.length,
      rowLimit: built.guardRails.rowLimit,
    });

    return {
      aggregates: built.aggregates,
      estimate: built.guardRails.estimate,
      groupingSetMasks: built.groupingSetMasks,
      keys: built.keys,
      maskAlias: built.maskAlias,
      rows: result.rows as readonly TRow[],
      truncations: toGroupKeyTruncations({
        capabilities,
        periods: descriptor.periods,
      }),
      ...(built.guardRails.warning !== undefined && {
        warning: built.guardRails.warning,
      }),
    };
  };

  return tx === undefined ? withTransaction({ run }) : run(tx);
};
