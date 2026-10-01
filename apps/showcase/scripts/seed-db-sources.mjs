/**
 * The SQL the showcase seeder applies, in order, and the one edit it makes.
 *
 * `enterprise_orders` is defined once, in the file `@lcabrera/devkit` ships to a
 * new application, and the showcase reads that file instead of holding a copy.
 * The shipped seed is demo-sized; the showcase raises its row bound to load-test
 * the table, which is the one change that file says it tolerates
 * (ADR-071). Pure: it reads nothing and connects to nothing.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKSPACE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const REPO_ROOT = join(WORKSPACE_ROOT, '..', '..');

export const ENTERPRISE_ORDERS_DDL = join(
  REPO_ROOT,
  'packages',
  'devkit',
  'assets',
  'full',
  'apps',
  'web',
  'db',
  'setup_enterprise_orders.sql',
);

export const LOAD_TEST_ROWS = 500_000;

const ROW_BOUND = /generate_series\(1, \d+\) AS gs/gu;

export const withRowBound = (sql, rows) => {
  const bounds = sql.match(ROW_BOUND) ?? [];
  if (bounds.length !== 1) {
    throw new Error(
      `Expected exactly one 'generate_series(1, <rows>) AS gs' row bound in ${ENTERPRISE_ORDERS_DDL}, found ${bounds.length}. The showcase raises that bound to seed its load-test volume.`,
    );
  }
  return sql.replaceAll(ROW_BOUND, () => `generate_series(1, ${rows}) AS gs`);
};

const unchanged = (sql) => sql;

export const SEED_SOURCES = [
  {
    path: join(WORKSPACE_ROOT, 'db', 'setup_large_data.sql'),
    prepare: unchanged,
  },
  {
    path: ENTERPRISE_ORDERS_DDL,
    prepare: (sql) => withRowBound(sql, LOAD_TEST_ROWS),
  },
];
