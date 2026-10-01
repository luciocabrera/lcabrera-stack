import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const SHIPPED_DDL = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'assets',
  'full',
  'apps',
  'web',
  'db',
  'setup_enterprise_orders.sql',
);

const ROW_BOUND = /generate_series\(1, \d+\) AS gs/gu;

describe('the full rung’s enterprise_orders DDL', () => {
  it('holds exactly one `generate_series(1, <n>) AS gs` row bound, the one value its header says to raise to change the seeded volume', () => {
    const sql = readFileSync(SHIPPED_DDL, 'utf8');

    expect(sql.match(ROW_BOUND) ?? []).toHaveLength(1);
  });
});
