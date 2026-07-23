import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';

import type { DbSanityResult } from '../../types/api.types.js';

import { SANITY_TABLES } from '../../constants/server.constants.js';

export type DbSanityRepository = {
  readonly getDbSanity: () => Promise<DbSanityResult>;
};

type SanitySource = {
  readonly column: string;
  readonly schema: string;
};

/**
 * Per-table primary key + schema for the row-count health check. `getRowsCount`
 * counts an explicit column (never `count(*)`), so each sanity table names the
 * PK to count. `satisfies` requires an entry for every `SANITY_TABLES` member,
 * so adding a table without its count source fails typecheck.
 */
const SANITY_SOURCES = {
  car_sales: { column: 'car_id', schema: 'public' },
  enterprise_orders: { column: 'order_id', schema: 'public' },
  wide_alltypes_150: { column: 'id', schema: 'public' },
} as const satisfies Record<(typeof SANITY_TABLES)[number], SanitySource>;

/**
 * Database access for DB health checks — one `getRowsCount` per sanity table,
 * counting its primary key. Reaches the `getPool()` singleton, so no injected
 * pool.
 */
export const createDbSanityRepository = (): DbSanityRepository => ({
  getDbSanity: async () => {
    const tableCounts: Record<string, number | undefined> = {};
    const issues: string[] = [];

    for (const tableName of SANITY_TABLES) {
      const { column, schema } = SANITY_SOURCES[tableName];

      try {
        const rowCount = await getRowsCount({
          column,
          schema,
          table: tableName,
        });
        tableCounts[tableName] = rowCount;

        if (rowCount === 0) {
          issues.push(`Table ${tableName} exists but has 0 rows`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
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
});
