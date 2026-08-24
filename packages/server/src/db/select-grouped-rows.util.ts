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

/**
 * `capabilities` is resolved here rather than supplied, which is the whole
 * reason this executor exists: the builder is pure and needs the catalogue's
 * answer, and a caller left to fetch it itself would be one `await` away from
 * passing a hand-written map and defeating ADR-058's gates.
 */
type SelectGroupedRowsArgs = Omit<GroupQueryDescriptor, 'capabilities'>;

/**
 * Four things happen in an order that is not arbitrary (ADR-066): 1.
 * **Depth, before anything else.** It is pure, so a request past the cap is refused
 * without borrowing a connection or issuing a catalogue query.
 * **A transaction, always.** Not for atomicity — a read needs none — but because
 * `statement_timeout` can only be set for *this* query by being set transaction-locally.
 */
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
      // Emitted rather than left to the caller: it pairs the requested
      // granularities with a catalogue fact — whether the column is zoned —
      // that only this side has already read, and both the row heading and a
      // later drill are wrong in a way that renders without it (#786).
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
