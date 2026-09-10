import type { QueryResultRow } from 'pg';

import type { ExecutorOptions, TransactionClient } from './db.types.ts';
import type {
  ColumnAxisRequest,
  GroupQueryDescriptor,
} from './group-query-builder/group-query-builder.types.ts';

import { readGroupStatementTimeoutMs } from './env.schema.ts';
import { getColumnGroupingCapabilities } from './get-column-grouping-capabilities.util.ts';
import { assertGroupDepth } from './group-query-builder/assert-group-depth.util.ts';
import { assertGroupRowBackstop } from './group-query-builder/assert-group-row-backstop.util.ts';
import { buildGroupQuery } from './group-query-builder/build-group-query.util.ts';
import { collectCapabilityColumns } from './group-query-builder/collect-capability-columns.util.ts';
import { toGroupKeyTruncations } from './olap/to-group-key-truncations.util.ts';
import { runQuery } from './run-query.util.ts';
import { selectColumnAxisValues } from './select-column-axis-values.util.ts';
import { setStatementTimeout } from './set-statement-timeout.util.ts';
import { withTransaction } from './with-transaction.util.ts';

type SelectGroupedRowsArgs = Omit<
  GroupQueryDescriptor,
  'capabilities' | 'columnAxis'
> & {
  readonly columnAxis?: ColumnAxisRequest;
};

export const selectGroupedRows = async <TRow extends QueryResultRow>({
  tx,
  ...descriptor
}: ExecutorOptions & SelectGroupedRowsArgs) => {
  const { columnAxis: columnAxisRequest, ...grouped } = descriptor;

  assertGroupDepth({
    grouping: grouped.grouping,
    keys: grouped.keys,
  });

  const run = async (client: TransactionClient) => {
    await setStatementTimeout({
      timeoutMs: readGroupStatementTimeoutMs({ env: process.env }),
      tx: client,
    });

    const capabilities = await getColumnGroupingCapabilities({
      columns: collectCapabilityColumns({
        aggregates: grouped.aggregates,
        columnAxisKey: columnAxisRequest?.key,
        keys: grouped.keys,
      }),
      schema: grouped.schema,
      table: grouped.table,
      tx: client,
    });

    const columnAxis =
      columnAxisRequest === undefined
        ? undefined
        : {
            ...columnAxisRequest,
            values: await selectColumnAxisValues({
              allowedColumns: grouped.allowedColumns,
              filters: grouped.filters,
              key: columnAxisRequest.key,
              maxDistinct: columnAxisRequest.maxDistinct,
              schema: grouped.schema,
              table: grouped.table,
              tx: client,
            }),
          };

    const built = buildGroupQuery({
      ...grouped,
      capabilities,
      ...(columnAxis !== undefined && { columnAxis }),
    });
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
      ...(built.columnAxis !== undefined && { columnAxis: built.columnAxis }),
      truncations: toGroupKeyTruncations({
        capabilities,
        periods: grouped.periods,
      }),
      ...(built.guardRails.warning !== undefined && {
        warning: built.guardRails.warning,
      }),
    };
  };

  return tx === undefined ? withTransaction({ run }) : run(tx);
};
