import type { Pool } from 'pg';

import { SANITY_TABLES } from '../../constants/server.constants';
import type { CountRow, DbSanityResult } from '../../types/api.types';

export type DbSanityRepository = {
  readonly getDbSanity: () => Promise<DbSanityResult>;
};

type CreateDbSanityRepositoryArgs = {
  readonly pool: Pool;
};

/**
 * Database access for DB health checks.
 */
export const createDbSanityRepository = ({
  pool,
}: CreateDbSanityRepositoryArgs): DbSanityRepository => {
  const getTableRowCount = async (
    tableName: (typeof SANITY_TABLES)[number],
  ) => {
    const result = await pool.query<CountRow>(
      `SELECT COUNT(*) FROM ${tableName}`,
    );
    return Number.parseInt(result.rows[0]?.count ?? '0', 10);
  };

  return {
    getDbSanity: async () => {
      const tableCounts: Record<string, number | undefined> = {};
      const issues: string[] = [];

      for (const tableName of SANITY_TABLES) {
        try {
          const rowCount = await getTableRowCount(tableName);
          tableCounts[tableName] = rowCount;

          if (rowCount === 0) {
            issues.push(`Table ${tableName} exists but has 0 rows`);
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          tableCounts[tableName] = undefined;
          issues.push(`Failed to query ${tableName}: ${message}`);
        }
      }

      return {
        isHealthy: issues.length === 0,
        issues,
        tableCounts,
      };
    },
  };
};
