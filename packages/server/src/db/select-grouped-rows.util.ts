import type { QueryResultRow } from 'pg';

import type { ExecutorOptions, TransactionClient } from './db.types.ts';
import type {
  ColumnAxisRequest,
  GroupQueryDescriptor,
} from './group-query-builder/group-query-builder.types.ts';

import { readGroupStatementTimeoutMs } from './env.schema.ts';
import { getReadGroupingCapabilities } from './get-read-grouping-capabilities.util.ts';
import { assertColumnAxisKey } from './group-query-builder/assert-column-axis-key.util.ts';
import { assertGroupAggregates } from './group-query-builder/assert-group-aggregates.util.ts';
import { assertGroupDepth } from './group-query-builder/assert-group-depth.util.ts';
import { assertGroupRowBackstop } from './group-query-builder/assert-group-row-backstop.util.ts';
import { buildGroupedRead } from './group-query-builder/build-grouped-read.util.ts';
import { collectCapabilityColumns } from './group-query-builder/collect-capability-columns.util.ts';
import { isUnexpandedLeadingCount } from './group-query-builder/is-unexpanded-leading-count.util.ts';
import { toColumnAxisDiscoveryLimit } from './group-query-builder/to-column-axis-discovery-limit.util.ts';
import { toExpandingMeasureCount } from './group-query-builder/to-expanding-measure-count.util.ts';
import { toGroupKeyTruncations } from './olap/to-group-key-truncations.util.ts';
import { resolveReadScope } from './query-builder/resolve-read-scope.util.ts';
import { toColumnName } from './query-builder/to-column-name.util.ts';
import { resolveReadRelations } from './resolve-read-relations.util.ts';
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
    keys: grouped.keys.map((key) => toColumnName(key)),
  });

  const run = async (client: TransactionClient) => {
    await setStatementTimeout({
      timeoutMs: readGroupStatementTimeoutMs({ env: process.env }),
      tx: client,
    });

    const relations = await resolveReadRelations({ ...grouped, tx: client });
    const scope = resolveReadScope({ ...grouped, relations });
    const capabilities = await getReadGroupingCapabilities({
      references: collectCapabilityColumns({
        aggregates: grouped.aggregates,
        columnAxisKey: columnAxisRequest?.key,
        keys: grouped.keys,
      }),
      schema: grouped.schema,
      scope,
      table: grouped.table,
      tx: client,
    });

    if (columnAxisRequest !== undefined) {
      assertColumnAxisKey({
        allowedColumns: grouped.allowedColumns,
        capabilities,
        key: columnAxisRequest.key,
        keys: grouped.keys,
        scope,
      });
      assertGroupAggregates({
        aggregates: grouped.aggregates,
        allowedColumns: grouped.allowedColumns,
        capabilities,
        scope,
      });
    }

    const expandingMeasureCount = toExpandingMeasureCount(grouped.aggregates);
    const columnAxis =
      columnAxisRequest === undefined || expandingMeasureCount === 0
        ? undefined
        : {
            ...columnAxisRequest,
            values: await selectColumnAxisValues({
              allowedColumns: grouped.allowedColumns,
              filters: grouped.filters,
              joins: grouped.joins,
              key: columnAxisRequest.key,
              limit: toColumnAxisDiscoveryLimit({
                keyCount: grouped.keys.length,
                maxDistinct: columnAxisRequest.maxDistinct,
                measureCount: expandingMeasureCount,
                ...(isUnexpandedLeadingCount(grouped.aggregates[0]) && {
                  fixedAggregateCount: 1,
                }),
              }),
              maxDistinct: columnAxisRequest.maxDistinct,
              relations,
              schema: grouped.schema,
              table: grouped.table,
              tx: client,
            }),
          };

    const built = buildGroupedRead({
      ...grouped,
      capabilities,
      ...(columnAxis !== undefined && { columnAxis }),
      ...(relations !== undefined && { relations }),
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
