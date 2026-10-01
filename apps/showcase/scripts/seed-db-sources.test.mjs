import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

import {
  ENTERPRISE_ORDERS_DDL,
  LOAD_TEST_ROWS,
  REPO_ROOT,
  SEED_SOURCES,
  withRowBound,
} from './seed-db-sources.mjs';

const DEFINES_ENTERPRISE_ORDERS =
  /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?public"?\.)?"?enterprise_orders"?[\s(]/iu;

const trackedSqlFiles = () =>
  execFileSync('git', ['ls-files', '-z', '--', '*.sql'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  })
    .split('\0')
    .filter((path) => path !== '');

const shippedDdl = readFileSync(ENTERPRISE_ORDERS_DDL, 'utf8');

const lineDifferences = (before, after) => {
  const afterLines = after.split('\n');
  return before
    .split('\n')
    .map((line, index) => ({ after: afterLines[index], before: line }))
    .filter(({ after: changed, before: original }) => changed !== original);
};

describe('the enterprise_orders definition', () => {
  it('lives in exactly one tracked file, the one devkit ships', () => {
    const definitions = trackedSqlFiles().filter((path) =>
      DEFINES_ENTERPRISE_ORDERS.test(
        readFileSync(join(REPO_ROOT, path), 'utf8'),
      ),
    );

    expect(definitions).toStrictEqual([
      relative(REPO_ROOT, ENTERPRISE_ORDERS_DDL),
    ]);
  });

  it('is what the seeder applies for that table', () => {
    expect(SEED_SOURCES.map(({ path }) => path)).toContain(
      ENTERPRISE_ORDERS_DDL,
    );
  });
});

describe('withRowBound', () => {
  it('changes the shipped row bound and no other line', () => {
    const prepared = withRowBound(shippedDdl, LOAD_TEST_ROWS);

    expect(prepared.split('\n')).toHaveLength(shippedDdl.split('\n').length);
    expect(lineDifferences(shippedDdl, prepared)).toStrictEqual([
      {
        after: expect.stringContaining(
          `generate_series(1, ${LOAD_TEST_ROWS}) AS gs`,
        ),
        before: expect.stringMatching(/generate_series\(1, \d+\) AS gs/u),
      },
    ]);
  });

  it('refuses SQL with no row bound to raise', () => {
    expect(() => withRowBound('SELECT 1;', LOAD_TEST_ROWS)).toThrow(/found 0/u);
  });

  it('refuses SQL with more than one row bound', () => {
    const twice = 'generate_series(1, 5) AS gs; generate_series(1, 9) AS gs;';

    expect(() => withRowBound(twice, LOAD_TEST_ROWS)).toThrow(/found 2/u);
  });
});
