import type { DbSanityRepository } from '../features/dbSanity/dbSanity.repository.js';

type RunStartupDbSanityCheckArgs = {
  readonly dbSanityRepository: DbSanityRepository;
  readonly repopulateCommand: string;
};

/**
 * Runs DB sanity checks at startup and logs actionable diagnostics.
 */
export const runStartupDbSanityCheck = async ({
  dbSanityRepository,
  repopulateCommand,
}: RunStartupDbSanityCheckArgs): Promise<void> => {
  try {
    const sanity = await dbSanityRepository.getDbSanity();

    if (sanity.isHealthy) {
      console.warn('✅ [DB Sanity] Table counts:', sanity.tableCounts);
      return;
    }

    console.warn('⚠️ [DB Sanity] Potential data/connection issues detected');

    for (const issue of sanity.issues) {
      console.warn(`   - ${issue}`);
    }

    console.warn(`   - Run ${repopulateCommand} to repopulate tables.`);
  } catch (error: unknown) {
    console.error('❌ [DB Sanity] Startup sanity check failed:', error);
  }
};
