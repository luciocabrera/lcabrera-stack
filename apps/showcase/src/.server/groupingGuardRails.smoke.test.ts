// @vitest-environment node

import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import { GroupingRefusedError } from '@lcabrera/server/errors/grouping-refused.error';
import { QueryCanceledError } from '@lcabrera/server/errors/query-canceled.error';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

/**
 * The live-Postgres half of #573. `@lcabrera/server`'s own suite is DB-free
 * (ADR-032), so it can assert that the guard rails are wired and that the right
 * SQL is emitted, but never the two things that only a real server can settle:
 * that the transaction-scoped `statement_timeout` actually cancels a query, and
 * that the pool default is intact on the next query using the same connection.
 *
 * Both are the kind of claim a mocked test reports green on whether or not the
 * code works, which is why they are here (ADR-066).
 *
 * The suite forces `DB_POOL_MAX = 1` before opening the pool, so "the same
 * pooled connection" is not a hope — every borrow is the one connection, and
 * `pg_backend_pid()` is asserted to prove it rather than assumed.
 *
 * Gated behind `SMOKE_DB` like the sibling suites, so the DB-less CI unit job
 * and a bare `vp run test` skip it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/showcase (sources DB_* + sets SMOKE_DB)
 */
const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const SCHEMA = 'public';

/** One row, and a view over it whose group key evaluates `pg_sleep`. */
const SLOW_SOURCE = `${SCHEMA}.grouping_guard_slow_source`;
const SLOW_VIEW_NAME = 'grouping_guard_slow_view';
const SLOW_VIEW = `${SCHEMA}.${SLOW_VIEW_NAME}`;
const SLOW_SECONDS = 3;

/** Analysed, so the estimator has real `n_distinct` for both keys. */
const WIDE_NAME = 'grouping_guard_wide';
const WIDE = `${SCHEMA}.${WIDE_NAME}`;
const WIDE_ROWS = 20_000;
const WIDE_A_DISTINCT = 400;
const WIDE_B_DISTINCT = 200;

/** Never analysed, so `pg_stats` holds no row for it at all. */
const SPARSE_NAME = 'grouping_guard_unanalysed';
const SPARSE = `${SCHEMA}.${SPARSE_NAME}`;
const SPARSE_KEYS = 8000;

/** The guard's own ceiling when it cannot estimate: `MAX_GROUP_ROWS_WARN + 1`. */
const BACKSTOP_ROWS = 5001;

const originalPoolMax = process.env.DB_POOL_MAX;
const originalGroupTimeout = process.env.DB_GROUP_STATEMENT_TIMEOUT_MS;

const withGroupTimeout = (timeoutMs: number) => {
  process.env.DB_GROUP_STATEMENT_TIMEOUT_MS = String(timeoutMs);
};

const readBackendPid = async () => {
  const { rows } = await getPool().query<{ readonly pid: number }>(
    'SELECT pg_backend_pid() AS pid',
  );

  return rows[0]?.pid;
};

const readStatementTimeout = async () => {
  const { rows } = await getPool().query<{
    readonly statement_timeout: string;
  }>('SHOW statement_timeout');

  return rows[0]?.statement_timeout;
};

const groupSlowView = async () =>
  selectGroupedRows({
    aggregates: [{ fn: 'count' }],
    allowedColumns: ['k'],
    grouping: 'flat',
    keys: ['k'],
    maxRows: 20_000,
    schema: SCHEMA,
    table: SLOW_VIEW_NAME,
  });

describe.skipIf(!IS_SMOKE_ENABLED)('grouped-read guard rails', () => {
  beforeAll(async () => {
    // Before the first `getPool()`: one connection means every borrow below is
    // the same physical one, which is what makes the restoration test a real
    // test rather than a coincidence.
    process.env.DB_POOL_MAX = '1';
    await closePool();

    await getPool().query(`DROP VIEW IF EXISTS ${SLOW_VIEW}`);
    await getPool().query(`DROP TABLE IF EXISTS ${SLOW_SOURCE}`);
    await getPool().query(`DROP TABLE IF EXISTS ${WIDE}`);
    await getPool().query(`DROP TABLE IF EXISTS ${SPARSE}`);

    await getPool().query(`CREATE TABLE ${SLOW_SOURCE} (k text)`);
    await getPool().query(`INSERT INTO ${SLOW_SOURCE} VALUES ('a')`);
    // `pg_sleep` returns void, so its text cast is the empty string and the key
    // is unchanged — but it is part of the group key, so the planner has to
    // evaluate it and cannot optimise the delay away.
    await getPool().query(
      `CREATE VIEW ${SLOW_VIEW} AS
         SELECT (k || pg_sleep(${SLOW_SECONDS})::text) AS k FROM ${SLOW_SOURCE}`,
    );

    await getPool().query(`CREATE TABLE ${WIDE} (a text, b text)`);
    await getPool().query(
      `INSERT INTO ${WIDE}
         SELECT 'a' || (g % ${WIDE_A_DISTINCT}), 'b' || (g % ${WIDE_B_DISTINCT})
           FROM generate_series(1, ${WIDE_ROWS}) g`,
    );
    await getPool().query(`ANALYZE ${WIDE}`);

    // Deliberately never analysed: a table with no `pg_stats` row at all is the
    // state the warn-and-proceed rail exists for. `autovacuum_enabled = false`
    // is load-bearing rather than tidy — without it the daemon analysed this
    // table part-way through the suite and every assertion below flipped, which
    // is exactly how a rail that only fires on missing statistics stops being
    // testable.
    await getPool().query(
      `CREATE TABLE ${SPARSE} (k text) WITH (autovacuum_enabled = false)`,
    );
    await getPool().query(
      `INSERT INTO ${SPARSE}
         SELECT 'k' || g FROM generate_series(1, ${SPARSE_KEYS}) g`,
    );
  });

  afterAll(async () => {
    await getPool().query(`DROP VIEW IF EXISTS ${SLOW_VIEW}`);
    await getPool().query(`DROP TABLE IF EXISTS ${SLOW_SOURCE}`);
    await getPool().query(`DROP TABLE IF EXISTS ${WIDE}`);
    await getPool().query(`DROP TABLE IF EXISTS ${SPARSE}`);
    await closePool();

    process.env.DB_POOL_MAX = originalPoolMax;
    process.env.DB_GROUP_STATEMENT_TIMEOUT_MS = originalGroupTimeout;
  });

  it(
    'cancels a grouped read that outruns its statement timeout',
    { timeout: 30_000 },
    async () => {
      withGroupTimeout(500);

      // The view sleeps for three seconds inside the group key, so this is not a
      // question of a busy machine: the query cannot finish inside 500 ms.
      await expect(groupSlowView()).rejects.toBeInstanceOf(QueryCanceledError);
    },
  );

  it(
    'carries SQLSTATE 57014 and none of the driver’s message',
    { timeout: 30_000 },
    async () => {
      withGroupTimeout(500);

      let caught: unknown;

      try {
        await groupSlowView();
      } catch (error) {
        caught = error;
      }

      expect(caught).toMatchObject({ fields: { code: '57014' } });
      expect((caught as Error).message).not.toContain('statement timeout');
    },
  );

  it(
    'runs the same query to completion once the timeout allows it',
    { timeout: 30_000 },
    async () => {
      // The probe that could have disproved the two above. If the fixture were
      // simply broken — a bad view, an unreadable column — this would fail too,
      // and the cancellation would prove nothing about the timeout.
      withGroupTimeout(SLOW_SECONDS * 1000 + 5000);

      const result = await groupSlowView();

      expect(result.rows).toHaveLength(1);
    },
  );

  it(
    'leaves the pool default intact for the next query on the same connection',
    { timeout: 30_000 },
    async () => {
      const poolDefault = await readStatementTimeout();
      const pidBefore = await readBackendPid();

      // Short enough that a leak would be unmistakable, long enough for a
      // 400-group read over 20 000 rows.
      withGroupTimeout(700);
      await selectGroupedRows({
        aggregates: [{ fn: 'count' }],
        allowedColumns: ['a', 'b'],
        grouping: 'flat',
        keys: ['a'],
        maxRows: 20_000,
        schema: SCHEMA,
        table: WIDE_NAME,
      });

      const pidAfter = await readBackendPid();

      // Without this the whole test proves nothing: a *different* connection
      // would also report an untouched timeout.
      expect(pidAfter).toBe(pidBefore);

      // Behavioural, not a configuration read. Two seconds of sleep is nearly
      // three times the ceiling the grouped read installed, so this statement
      // could only survive if that ceiling died with its transaction.
      await expect(
        getPool().query('SELECT pg_sleep(2)'),
      ).resolves.toBeDefined();
      expect(await readStatementTimeout()).toBe(poolDefault);
      expect(await readBackendPid()).toBe(pidBefore);
    },
  );

  it(
    'leaves its ceiling on a caller-supplied transaction until that transaction ends',
    { timeout: 30_000 },
    async () => {
      // The documented consequence of transaction-locality, pinned rather than
      // left as prose: a caller passing its own `tx` gets the grouped read's
      // ceiling applied to the rest of *its* transaction too.
      const client = await getPool().connect();

      try {
        await client.query('BEGIN');
        withGroupTimeout(700);
        await selectGroupedRows({
          aggregates: [{ fn: 'count' }],
          allowedColumns: ['a', 'b'],
          grouping: 'flat',
          keys: ['a'],
          maxRows: 20_000,
          schema: SCHEMA,
          table: WIDE_NAME,
          tx: client,
        });

        // Still inside the caller's transaction, so the 700 ms ceiling is still
        // in force and a two-second sleep cannot survive it.
        await expect(client.query('SELECT pg_sleep(2)')).rejects.toMatchObject({
          code: '57014',
        });
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }

      // …and it does end with the transaction, on the very same connection.
      await expect(
        getPool().query('SELECT pg_sleep(2)'),
      ).resolves.toBeDefined();
    },
  );

  it('refuses a grouping whose estimate is past the ceiling, naming the column', async () => {
    withGroupTimeout(10_000);

    // 400 x 200 = 80 000 estimated rows against a 50 000 ceiling. Both columns
    // are legal keys on their own — it is the product that is refused.
    let caught: unknown;

    try {
      await selectGroupedRows({
        aggregates: [{ fn: 'count' }],
        allowedColumns: ['a', 'b'],
        grouping: 'flat',
        keys: ['a', 'b'],
        maxRows: 20_000,
        schema: SCHEMA,
        table: WIDE_NAME,
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(GroupingRefusedError);
    expect(caught).toMatchObject({ column: 'a', reason: 'estimate-too-large' });
    expect((caught as Error).message).toContain('"a"');
  });

  it('reports the real catalogue estimate for an analysed table', async () => {
    withGroupTimeout(10_000);

    const result = await selectGroupedRows({
      aggregates: [{ fn: 'count' }],
      allowedColumns: ['a', 'b'],
      grouping: 'flat',
      keys: ['b'],
      maxRows: 20_000,
      schema: SCHEMA,
      table: WIDE_NAME,
    });

    // The estimate is the catalogue's, not a guess of ours, so it is asserted
    // against the fixture's real cardinality.
    expect(result.estimate).toEqual({
      kind: 'known',
      rows: WIDE_B_DISTINCT,
    });
    expect(result.warning).toBeUndefined();
    expect(result.rows).toHaveLength(WIDE_B_DISTINCT);
  });

  it('has no statistics for the unanalysed fixture, which the two rails below assume', async () => {
    // The precondition, asserted rather than assumed: if anything analyses this
    // table the two tests after it stop testing what they claim to.
    const { rows } = await getPool().query(
      `SELECT 1 FROM pg_stats WHERE schemaname = $1 AND tablename = $2`,
      [SCHEMA, SPARSE_NAME],
    );

    expect(rows).toHaveLength(0);
  });

  it('warns and proceeds when the table has never been analysed', async () => {
    withGroupTimeout(10_000);

    // A caller ceiling below the guard's own, so the read completes and the
    // warning is the whole observation.
    const result = await selectGroupedRows({
      aggregates: [{ fn: 'count' }],
      allowedColumns: ['k'],
      grouping: 'flat',
      keys: ['k'],
      maxRows: 100,
      schema: SCHEMA,
      table: SPARSE_NAME,
    });

    expect(result.warning).toEqual({
      columns: ['k'],
      kind: 'stats-unavailable',
    });
    expect(result.estimate).toEqual({ columns: ['k'], kind: 'unknown' });
    // Proceeded, rather than being refused for want of statistics.
    expect(result.rows).toHaveLength(100);
  });

  it('backstops an unanalysed grouping at the row limit instead of truncating it', async () => {
    withGroupTimeout(10_000);

    // 8 000 distinct keys and no statistics to predict them from. The read runs
    // under the guard's ceiling, reaches it, and is refused — returning 5 001 of
    // 8 000 groups would be a result whose subtotals silently do not add up.
    let caught: unknown;

    try {
      await selectGroupedRows({
        aggregates: [{ fn: 'count' }],
        allowedColumns: ['k'],
        grouping: 'flat',
        keys: ['k'],
        maxRows: 20_000,
        schema: SCHEMA,
        table: SPARSE_NAME,
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(GroupingRefusedError);
    expect(caught).toMatchObject({
      estimatedRows: BACKSTOP_ROWS,
      reason: 'row-limit-reached',
    });
  });
});
