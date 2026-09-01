// @vitest-environment node

/**
 * The live-Postgres half of #573: that the transaction-scoped
 * `statement_timeout` actually cancels a query, and that the pool default is
 * intact on the next query using the same connection (ADR-066). Both are claims
 * a mocked test reports green on whether or not the code works.
 *
 * `DB_POOL_MAX` is forced to 1 before the pool opens, so "the same pooled
 * connection" is asserted through `pg_backend_pid()` rather than hoped for.
 *
 * Gated behind `SMOKE_DB`, so the DB-less CI unit job and a bare `vp run test`
 * skip it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/showcase (sources DB_* + sets SMOKE_DB)
 */

import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import { GroupingRefusedError } from '@lcabrera/server/errors/grouping-refused.error';
import { QueryCanceledError } from '@lcabrera/server/errors/query-canceled.error';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const SCHEMA = 'public';

const SLOW_SOURCE = `${SCHEMA}.grouping_guard_slow_source`;
const SLOW_VIEW_NAME = 'grouping_guard_slow_view';
const SLOW_VIEW = `${SCHEMA}.${SLOW_VIEW_NAME}`;
const SLOW_SECONDS = 3;

const WIDE_NAME = 'grouping_guard_wide';
const WIDE = `${SCHEMA}.${WIDE_NAME}`;
const WIDE_ROWS = 20_000;
const WIDE_A_DISTINCT = 400;
const WIDE_B_DISTINCT = 200;

const SPARSE_NAME = 'grouping_guard_unanalysed';
const SPARSE = `${SCHEMA}.${SPARSE_NAME}`;
const SPARSE_KEYS = 8000;

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
    process.env.DB_POOL_MAX = '1';
    await closePool();

    await getPool().query(`DROP VIEW IF EXISTS ${SLOW_VIEW}`);
    await getPool().query(`DROP TABLE IF EXISTS ${SLOW_SOURCE}`);
    await getPool().query(`DROP TABLE IF EXISTS ${WIDE}`);
    await getPool().query(`DROP TABLE IF EXISTS ${SPARSE}`);

    await getPool().query(`CREATE TABLE ${SLOW_SOURCE} (k text)`);
    await getPool().query(`INSERT INTO ${SLOW_SOURCE} VALUES ('a')`);
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

      expect(pidAfter).toBe(pidBefore);

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

        await expect(client.query('SELECT pg_sleep(2)')).rejects.toMatchObject({
          code: '57014',
        });
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }

      await expect(
        getPool().query('SELECT pg_sleep(2)'),
      ).resolves.toBeDefined();
    },
  );

  it('refuses a grouping whose estimate is past the ceiling, naming the column', async () => {
    withGroupTimeout(10_000);

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

    expect(result.estimate).toEqual({
      kind: 'known',
      rows: WIDE_B_DISTINCT,
    });
    expect(result.warning).toBeUndefined();
    expect(result.rows).toHaveLength(WIDE_B_DISTINCT);
  });

  it('has no statistics for the unanalysed fixture, which the two rails below assume', async () => {
    const { rows } = await getPool().query(
      `SELECT 1 FROM pg_stats WHERE schemaname = $1 AND tablename = $2`,
      [SCHEMA, SPARSE_NAME],
    );

    expect(rows).toHaveLength(0);
  });

  it('warns and proceeds when the table has never been analysed', async () => {
    withGroupTimeout(10_000);

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
    expect(result.rows).toHaveLength(100);
  });

  it('backstops an unanalysed grouping at the row limit instead of truncating it', async () => {
    withGroupTimeout(10_000);

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
