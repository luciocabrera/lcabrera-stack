import type { QueryResultRow } from 'pg';

import type { ExecutorOptions, TransactionClient } from './db.types.ts';
import type { GroupQueryDescriptor } from './group-query-builder/group-query-builder.types.ts';

import { readGroupStatementTimeoutMs } from './env.schema.ts';
import { getColumnGroupingCapabilities } from './get-column-grouping-capabilities.util.ts';
import { assertGroupDepth } from './group-query-builder/assert-group-depth.util.ts';
import { assertGroupRowBackstop } from './group-query-builder/assert-group-row-backstop.util.ts';
import { buildGroupQuery } from './group-query-builder/build-group-query.util.ts';
import { collectCapabilityColumns } from './group-query-builder/collect-capability-columns.util.ts';
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
 * Runs a grouped read under its own guard rails: refuse what is too deep,
 * resolve what each column may do, bound the result, and cut the query off at a
 * ceiling of its own.
 *
 * Four things happen in an order that is not arbitrary (ADR-066):
 *
 * 1. **Depth, before anything else.** It is pure, so a request past the cap is
 *    refused without borrowing a connection or issuing a catalogue query.
 * 2. **A transaction, always.** Not for atomicity — a read needs none — but
 *    because `statement_timeout` can only be set for *this* query by being set
 *    transaction-locally. Outside one it would persist on the pooled connection
 *    and re-tune every later query that borrows it.
 * 3. **The timeout first inside it**, so it covers the catalogue query too.
 * 4. **The capability answer and the query it authorises share the connection**,
 *    so both see one snapshot — and, critically, both are covered by the
 *    timeout. An executor called here without `tx` would silently run on the
 *    pool instead, outside the transaction, with no ceiling and no symptom.
 *
 * A caller's own `tx` is used as-is: it is already a transaction, so the timeout
 * is local to it and reverts at the caller's `COMMIT` exactly the same way.
 *
 * The result carries the emitted `aggregates`, `keys` and `maskAlias` because a
 * grouped row cannot be decoded without them, plus `estimate` and any `warning`
 * the rails produced — a grouping that ran on missing statistics is worth
 * saying out loud even though it succeeded.
 */
export const selectGroupedRows = async <TRow extends QueryResultRow>({
  tx,
  ...descriptor
}: ExecutorOptions & SelectGroupedRowsArgs) => {
  assertGroupDepth({ keys: descriptor.keys });

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
      ...(built.guardRails.warning !== undefined && {
        warning: built.guardRails.warning,
      }),
    };
  };

  return tx === undefined ? withTransaction({ run }) : run(tx);
};
