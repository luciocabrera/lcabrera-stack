import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { runStartupDbSanityCheck } from './runStartupDbSanityCheck.util.js';

describe('runStartupDbSanityCheck', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs table counts when the database is healthy', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dbSanityRepository = {
      getDbSanity: vi.fn().mockResolvedValue({
        isHealthy: true,
        issues: [],
        tableCounts: { orders: 10 },
      }),
    };

    await runStartupDbSanityCheck({
      dbSanityRepository,
      repopulateCommand: 'vp run seed',
    });

    expect(warnSpy).toHaveBeenCalledWith('✅ [DB Sanity] Table counts:', {
      orders: 10,
    });
  });

  it('logs issues and the repopulate command when the database is unhealthy', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dbSanityRepository = {
      getDbSanity: vi.fn().mockResolvedValue({
        isHealthy: false,
        issues: ['orders table is empty', 'customers table is empty'],
        tableCounts: { customers: 0, orders: 0 },
      }),
    };

    await runStartupDbSanityCheck({
      dbSanityRepository,
      repopulateCommand: 'vp run seed',
    });

    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      '⚠️ [DB Sanity] Potential data/connection issues detected',
    );
    expect(warnSpy).toHaveBeenNthCalledWith(2, '   - orders table is empty');
    expect(warnSpy).toHaveBeenNthCalledWith(3, '   - customers table is empty');
    expect(warnSpy).toHaveBeenNthCalledWith(
      4,
      '   - Run vp run seed to repopulate tables.',
    );
  });

  it('logs startup failures instead of throwing', async () => {
    const error = new Error('db unavailable');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const dbSanityRepository = {
      getDbSanity: vi.fn().mockRejectedValue(error),
    };

    await expect(
      runStartupDbSanityCheck({
        dbSanityRepository,
        repopulateCommand: 'vp run seed',
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      '❌ [DB Sanity] Startup sanity check failed:',
      error,
    );
  });
});
