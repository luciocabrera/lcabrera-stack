import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import {
  ENTERPRISE_ORDERS_DDL,
  LOAD_TEST_ROWS,
  REPO_ROOT,
  SEED_SOURCES,
  withRowBound,
} from './seed-db-sources.mjs';

const DEFINES_ENTERPRISE_ORDERS =
  /\bcreate\s+(?:(?:global|local)\s+)?(?:(?:unlogged|temp|temporary)\s+)?table\s+(?:if\s+not\s+exists\s+)?(?:"?\w+"?\.)?"?enterprise_orders\b/iu;

const TEXT_SOURCES = [
  '*.sql',
  '*.mjs',
  '*.cjs',
  '*.js',
  '*.ts',
  '*.tsx',
  '*.mts',
  '*.cts',
];

const THIS_TEST = relative(REPO_ROOT, fileURLToPath(import.meta.url));

const SHIPPED_DDL = relative(REPO_ROOT, ENTERPRISE_ORDERS_DDL);

const trackedTextFiles = () =>
  execFileSync('git', ['ls-files', '-z', '--', ...TEXT_SOURCES], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  })
    .split('\0')
    .filter((path) => path !== '');

const hasEnterpriseOrdersDefinition = (path) =>
  DEFINES_ENTERPRISE_ORDERS.test(readFileSync(join(REPO_ROOT, path), 'utf8'));

const shippedDdl = readFileSync(ENTERPRISE_ORDERS_DDL, 'utf8');

const lineDifferences = (before, after) => {
  const afterLines = after.split('\n');
  return before
    .split('\n')
    .map((line, index) => ({ after: afterLines[index], before: line }))
    .filter(({ after: changed, before: original }) => changed !== original);
};

describe('the enterprise_orders definition', () => {
  it('is defined by the file devkit ships', () => {
    expect(hasEnterpriseOrdersDefinition(SHIPPED_DDL)).toBe(true);
  });

  it('is defined by no other tracked source file, in SQL or embedded in code', () => {
    const copies = trackedTextFiles()
      .filter((path) => path !== SHIPPED_DDL && path !== THIS_TEST)
      .filter((path) => hasEnterpriseOrdersDefinition(path));

    expect(copies).toStrictEqual([]);
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
