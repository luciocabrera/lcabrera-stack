import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { afterAll, describe, expect, it } from 'vitest';

import { getActiveScanners } from './getActiveScanners.util.ts';

describe('getActiveScanners', () => {
  afterAll(async () => {
    await closePool();
  });

  it('returns the active scanners — eslint/oxlint in, retired linter out (ADR-019)', async () => {
    const scanners = await getActiveScanners();
    const scannerIds = scanners.map((s) => s.scanner_id);

    expect(scannerIds).toEqual(
      expect.arrayContaining([
        'fallow',
        'eslint',
        'oxlint',
        'code-smell-checker',
        'code-smell-zen',
      ]),
    );
    expect(scannerIds).not.toContain('linter');
    expect(scanners.every((s) => s.display_name.length > 0)).toBe(true);
  });

  it('never returns duplicate scanner ids', async () => {
    const pool = getPool();
    const before = await pool.query('SELECT count(*) FROM cqms.scanners');
    const scanners = await getActiveScanners();
    expect(new Set(scanners.map((s) => s.scanner_id)).size).toBe(
      scanners.length,
    );
    expect(Number(before.rows[0].count)).toBeGreaterThanOrEqual(
      scanners.length,
    );
  });
});
